"""
Instagrapi Bridge — microserviço que encapsula a instagrapi (API privada do Instagram)
e expõe endpoints REST para o backend Node do Bizy.

Funcionalidades:
- Login com username/password (salva sessão + device fingerprint em disco)
- Polling de DMs novas (envia webhook ao backend)
- Envio de DMs (texto e media)
- Consulta de perfil de utilizador

Anti-challenge strategies:
- Persistir device fingerprint (device_id, phone_id, uuid) entre logins e restarts
- Reutilizar sessão salva antes de tentar login fresco
- Cooldown exponencial após challenges
- Locale/timezone realistas para Angola
- Suporte a proxy residencial via env
"""

import asyncio
import json
import logging
import os
import random
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from instagrapi import Client as InstaClient
from instagrapi.exceptions import (
    BadPassword,
    ChallengeRequired,
    LoginRequired,
    TwoFactorRequired,
)
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

WEBHOOK_URL = os.getenv("INSTAGRAM_WEBHOOK_URL", "http://backend:3333/webhooks/instagram")
WEBHOOK_TOKEN = os.getenv("INSTAGRAM_WEBHOOK_TOKEN", "")
BRIDGE_TOKEN = os.getenv("INSTAGRAM_BRIDGE_TOKEN", "")
SESSIONS_DIR = Path(os.getenv("INSTAGRAM_SESSIONS_DIR", "/app/sessions"))
POLL_INTERVAL = int(os.getenv("INSTAGRAM_POLL_INTERVAL_SECONDS", "30"))
DM_FETCH_LIMIT = int(os.getenv("INSTAGRAM_DM_FETCH_LIMIT", "20"))
PROXY_URL = os.getenv("INSTAGRAM_PROXY_URL", "")  # ex: http://user:pass@proxy:port

logger = logging.getLogger("instagrapi-bridge")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# ---------------------------------------------------------------------------
# State — uma instância por conta Instagram (multi-tenant via instancia name)
# ---------------------------------------------------------------------------

instancias: dict[str, "InstanciaInstagram"] = {}
poll_task: asyncio.Task | None = None

# Cooldown global por conta — impede retries rápidos após challenge
_challenge_cooldown: dict[str, float] = {}  # nome -> timestamp até quando bloquear
_challenge_count: dict[str, int] = {}  # nome -> tentativas consecutivas


NOME_INSTANCIA_REGEX = r"^[a-zA-Z0-9_-]{1,50}$"


def _validar_nome_instancia(nome: str) -> str:
    """Valida nome de instância para evitar path traversal."""
    import re
    nome = nome.strip()
    if not re.match(NOME_INSTANCIA_REGEX, nome):
        raise ValueError(f"Nome de instância inválido: '{nome}'. Apenas letras, números, _ e - (máx 50 chars).")
    return nome


def _criar_client_configurado() -> InstaClient:
    """Cria InstaClient com configurações realistas para evitar detecção."""
    cl = InstaClient()
    cl.delay_range = [3, 7]

    # Locale e timezone para Angola (reduz suspeita de datacenter europeu)
    cl.set_locale("pt_AO")
    cl.set_country("AO")
    cl.set_country_code(244)
    cl.set_timezone_offset(3600)  # WAT = UTC+1

    # Proxy residencial se configurado
    if PROXY_URL:
        cl.set_proxy(PROXY_URL)
        logger.info("Proxy configurado: %s", PROXY_URL.split("@")[-1] if "@" in PROXY_URL else "***")

    return cl


class InstanciaInstagram:
    def __init__(self, nome: str, username: str):
        self.nome = _validar_nome_instancia(nome)
        self.username = username
        self.client = _criar_client_configurado()
        self.status = "CRIADA"
        self.ultimo_erro: str | None = None
        self.ultima_poll_em: datetime | None = None
        self.mensagens_vistas: set[str] = set()
        self.negocio_id: str | None = None

        # Tenta carregar device settings persistidos (mesmo se não há sessão completa)
        self._carregar_device_settings()

    @property
    def session_path(self) -> Path:
        return SESSIONS_DIR / f"{self.nome}.json"

    @property
    def device_path(self) -> Path:
        """Ficheiro separado para device fingerprint — sobrevive a logouts."""
        return SESSIONS_DIR / f"{self.nome}_device.json"

    def salvar_sessao(self):
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
        settings = self.client.get_settings()
        self.session_path.write_text(json.dumps(settings, default=str))
        # Salvar device settings separadamente para persistir entre logouts
        self._salvar_device_settings(settings)

    def _salvar_device_settings(self, settings: dict | None = None):
        """Persiste o fingerprint do dispositivo (sobrevive a logout e restart)."""
        if settings is None:
            settings = self.client.get_settings()
        device_data = {
            "device_settings": settings.get("device_settings", {}),
            "user_agent": settings.get("user_agent", ""),
            "uuid": settings.get("uuid", ""),
            "phone_id": settings.get("phone_id", ""),
            "advertising_id": settings.get("advertising_id", ""),
            "android_device_id": settings.get("android_device_id", ""),
            "request_id": settings.get("request_id", ""),
            "mid": settings.get("mid", ""),
        }
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
        self.device_path.write_text(json.dumps(device_data, default=str))

    def _carregar_device_settings(self):
        """Carrega fingerprint do dispositivo persistido — garante mesmo device_id entre logins."""
        if not self.device_path.exists():
            # Primeira vez: forçar geração de settings e depois salvar
            _ = self.client.get_settings()  # gera uuid, phone_id, device_id internamente
            self._salvar_device_settings()
            logger.info("Device fingerprint gerado e salvo para %s", self.nome)
            return

        try:
            device_data = json.loads(self.device_path.read_text())
            if not device_data.get("uuid"):
                # Device file vazio/corrompido — regenerar
                _ = self.client.get_settings()
                self._salvar_device_settings()
                logger.info("Device fingerprint regenerado para %s (ficheiro corrompido)", self.nome)
                return

            # Aplicar settings ao client ANTES do login
            current = self.client.get_settings()
            for key in ("device_settings", "user_agent", "uuid", "phone_id",
                        "advertising_id", "android_device_id", "request_id", "mid"):
                if key in device_data and device_data[key]:
                    current[key] = device_data[key]
            self.client.set_settings(current)
            logger.info("Device fingerprint restaurado para %s (device_id: %s)",
                        self.nome, device_data.get("android_device_id", "?"))
        except Exception as e:
            logger.warning("Falha ao carregar device settings para %s: %s", self.nome, e)

    def carregar_sessao(self) -> bool:
        """Tenta restaurar sessão completa sem fazer novo login."""
        if not self.session_path.exists():
            return False
        try:
            settings = json.loads(self.session_path.read_text())
            self.client.set_settings(settings)
            # Testar se sessão é válida com uma chamada leve (sem login)
            self.client.get_timeline_feed()
            logger.info("Sessão restaurada com sucesso para %s", self.nome)
            return True
        except Exception as e:
            logger.warning("Sessão expirada/inválida para %s: %s", self.nome, str(e)[:100])
            # Manter device settings mesmo que sessão falhe
            self._carregar_device_settings()
            return False


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    instancia: str
    username: str
    password: str
    negocio_id: str | None = None
    verification_code: str | None = None


class SendDmRequest(BaseModel):
    instancia: str
    user_id: str | None = None
    username: str | None = None
    text: str | None = None
    media_url: str | None = None


class ProfileRequest(BaseModel):
    instancia: str
    username: str


class StatusResponse(BaseModel):
    instancia: str
    username: str
    status: str
    ultimo_erro: str | None
    ultima_poll_em: str | None
    challenge_cooldown_restante: int | None = None


# ---------------------------------------------------------------------------
# Auth middleware
# ---------------------------------------------------------------------------

def verificar_token(authorization: str | None = Header(None), x_bridge_token: str | None = Header(None)):
    if not BRIDGE_TOKEN:
        return
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        token = x_bridge_token
    if token != BRIDGE_TOKEN:
        raise HTTPException(status_code=401, detail="Token inválido.")


# ---------------------------------------------------------------------------
# Challenge cooldown
# ---------------------------------------------------------------------------

def _verificar_cooldown(nome: str):
    """Verifica se a instância está em cooldown após challenge."""
    if nome in _challenge_cooldown:
        restante = _challenge_cooldown[nome] - time.time()
        if restante > 0:
            minutos = int(restante / 60)
            raise HTTPException(
                status_code=429,
                detail=f"Cooldown activo. Aguarde {minutos}min antes de tentar novamente. "
                       f"Resolva o challenge no app do Instagram primeiro."
            )
        else:
            del _challenge_cooldown[nome]
            _challenge_count.pop(nome, None)


def _registar_challenge(nome: str):
    """Regista um challenge e aplica backoff exponencial."""
    count = _challenge_count.get(nome, 0) + 1
    _challenge_count[nome] = count

    # Backoff: 5min, 15min, 30min, 60min, 120min
    delays = [300, 900, 1800, 3600, 7200]
    delay = delays[min(count - 1, len(delays) - 1)]
    # Adicionar jitter
    delay += random.randint(0, 60)

    _challenge_cooldown[nome] = time.time() + delay
    logger.warning("Challenge #%d para %s — cooldown de %dmin", count, nome, delay // 60)


def _limpar_challenge(nome: str):
    """Login bem-sucedido — limpar contador de challenges."""
    _challenge_cooldown.pop(nome, None)
    _challenge_count.pop(nome, None)


# ---------------------------------------------------------------------------
# Webhook emitter
# ---------------------------------------------------------------------------

http_client: httpx.AsyncClient | None = None


async def emitir_webhook(evento: str, dados: dict[str, Any]):
    global http_client
    if not http_client:
        http_client = httpx.AsyncClient(timeout=15.0)

    payload = {
        "event": evento,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": dados,
    }
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if WEBHOOK_TOKEN:
        headers["X-Instagram-Webhook-Token"] = WEBHOOK_TOKEN

    try:
        resp = await http_client.post(WEBHOOK_URL, json=payload, headers=headers)
        if resp.status_code >= 400:
            logger.warning("Webhook falhou: %s %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.warning("Erro ao emitir webhook: %s", e)


# ---------------------------------------------------------------------------
# DM polling
# ---------------------------------------------------------------------------

async def poll_dms():
    """Polling loop que verifica DMs novas para todas as instâncias activas."""
    while True:
        for nome, inst in list(instancias.items()):
            if inst.status != "CONECTADA":
                continue
            try:
                await _poll_instancia(inst)
                inst.ultima_poll_em = datetime.now(timezone.utc)
                inst.ultimo_erro = None
            except LoginRequired:
                inst.status = "SESSAO_EXPIRADA"
                inst.ultimo_erro = "Sessão expirada. Faça login novamente."
                logger.warning("Sessão expirada para %s", nome)
            except Exception as e:
                inst.ultimo_erro = str(e)[:500]
                logger.warning("Erro poll DMs %s: %s", nome, e)

        await asyncio.sleep(POLL_INTERVAL)


async def _poll_instancia(inst: InstanciaInstagram):
    """Verifica DMs novas para uma instância."""
    loop = asyncio.get_event_loop()
    try:
        threads = await asyncio.wait_for(
            loop.run_in_executor(None, _fetch_direct_threads, inst),
            timeout=60.0,
        )
    except asyncio.TimeoutError:
        logger.warning("Timeout ao buscar DMs para %s", inst.nome)
        return

    for thread in threads:
        for message in thread.messages:
            msg_id = str(message.id)
            if msg_id in inst.mensagens_vistas:
                continue
            inst.mensagens_vistas.add(msg_id)

            # Limitar set para evitar crescimento infinito
            if len(inst.mensagens_vistas) > 10_000:
                to_remove = list(inst.mensagens_vistas)[:5_000]
                for k in to_remove:
                    inst.mensagens_vistas.discard(k)

            # Ignorar mensagens enviadas por nós
            if str(message.user_id) == str(inst.client.user_id):
                continue

            sender_info = _resolver_sender(thread, message)
            payload = {
                "instancia": inst.nome,
                "negocioId": inst.negocio_id,
                "messageId": msg_id,
                "threadId": str(thread.id),
                "userId": str(message.user_id),
                "username": sender_info.get("username", ""),
                "fullName": sender_info.get("full_name", ""),
                "profilePicUrl": sender_info.get("profile_pic_url", ""),
                "text": message.text or "",
                "mediaType": _resolver_tipo_media(message),
                "mediaUrl": _resolver_media_url(message),
                "timestamp": message.timestamp.isoformat() if message.timestamp else datetime.now(timezone.utc).isoformat(),
            }

            await emitir_webhook("INSTAGRAM_DM_RECEIVED", payload)


def _fetch_direct_threads(inst: InstanciaInstagram):
    """Busca threads de DM (executado em thread separada para não bloquear o event loop)."""
    return inst.client.direct_threads(amount=DM_FETCH_LIMIT)


def _resolver_sender(thread, message) -> dict[str, str]:
    for user in (thread.users or []):
        if str(user.pk) == str(message.user_id):
            return {
                "username": user.username or "",
                "full_name": user.full_name or "",
                "profile_pic_url": str(user.profile_pic_url or ""),
            }
    return {}


def _resolver_tipo_media(message) -> str:
    if message.media_share:
        return "media_share"
    if message.visual_media:
        return "image"
    if message.voice_media:
        return "audio"
    if message.clip:
        return "video"
    if message.text:
        return "text"
    return "unknown"


def _resolver_media_url(message) -> str | None:
    try:
        if message.visual_media and hasattr(message.visual_media, "url"):
            return str(message.visual_media.url)
        if message.media_share and hasattr(message.media_share, "thumbnail_url"):
            return str(message.media_share.thumbnail_url)
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    global poll_task
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

    # Auto-restaurar sessões salvas no disco
    await _restaurar_sessoes()

    poll_task = asyncio.create_task(poll_dms())
    logger.info("Instagrapi Bridge iniciado. Poll interval: %ds | Proxy: %s",
                POLL_INTERVAL, "sim" if PROXY_URL else "não")
    yield
    if poll_task:
        poll_task.cancel()
    global http_client
    if http_client:
        await http_client.aclose()


async def _restaurar_sessoes():
    """No startup, tenta restaurar todas as sessões salvas em disco."""
    session_files = list(SESSIONS_DIR.glob("*.json"))
    # Filtrar apenas sessões (não device files)
    session_files = [f for f in session_files if not f.name.endswith("_device.json")]

    for sf in session_files:
        nome = sf.stem
        try:
            settings = json.loads(sf.read_text())
            username = settings.get("username", nome)

            inst = InstanciaInstagram(nome, username)
            instancias[nome] = inst

            loop = asyncio.get_event_loop()
            ok = await loop.run_in_executor(None, inst.carregar_sessao)
            if ok:
                inst.status = "CONECTADA"
                logger.info("Sessão auto-restaurada: %s (%s)", nome, username)
            else:
                inst.status = "SESSAO_EXPIRADA"
                logger.info("Sessão expirada no startup: %s", nome)
        except Exception as e:
            logger.warning("Falha ao restaurar sessão %s: %s", nome, str(e)[:100])


app = FastAPI(title="Instagrapi Bridge", version="2.0.0", lifespan=lifespan)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "instancias": len(instancias),
        "activas": sum(1 for i in instancias.values() if i.status == "CONECTADA"),
        "proxy": bool(PROXY_URL),
    }


@app.post("/login")
async def login(req: LoginRequest, authorization: str | None = Header(None), x_bridge_token: str | None = Header(None)):
    verificar_token(authorization, x_bridge_token)

    # Validar nome da instância (previne path traversal)
    try:
        nome_validado = _validar_nome_instancia(req.instancia)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Verificar cooldown de challenge
    _verificar_cooldown(nome_validado)

    inst = instancias.get(nome_validado)
    if not inst:
        inst = InstanciaInstagram(nome_validado, req.username)
        instancias[nome_validado] = inst

    inst.username = req.username
    inst.negocio_id = req.negocio_id

    loop = asyncio.get_event_loop()

    # Estratégia 1: Tentar restaurar sessão existente primeiro (sem password)
    if not req.verification_code and inst.session_path.exists():
        try:
            ok = await loop.run_in_executor(None, inst.carregar_sessao)
            if ok:
                inst.status = "CONECTADA"
                inst.ultimo_erro = None
                _limpar_challenge(nome_validado)
                logger.info("Login via sessão restaurada: %s (%s)", nome_validado, req.username)
                return {
                    "ok": True,
                    "instancia": nome_validado,
                    "username": req.username,
                    "user_id": str(inst.client.user_id),
                    "status": inst.status,
                    "metodo": "sessao_restaurada",
                }
        except Exception:
            logger.info("Sessão inválida para %s, tentando login fresco", nome_validado)

    # Estratégia 2: Login fresco (com o MESMO device fingerprint persistido)
    try:
        # Pequeno delay antes do login para parecer mais humano
        await asyncio.sleep(random.uniform(1.5, 3.0))

        if req.verification_code:
            await loop.run_in_executor(
                None,
                lambda: inst.client.login(req.username, req.password, verification_code=req.verification_code),
            )
        else:
            await loop.run_in_executor(
                None,
                lambda: inst.client.login(req.username, req.password),
            )
        inst.status = "CONECTADA"
        inst.ultimo_erro = None
        inst.salvar_sessao()
        _limpar_challenge(nome_validado)
        logger.info("Login bem-sucedido: %s (%s)", nome_validado, req.username)
    except TwoFactorRequired:
        inst.status = "AGUARDANDO_2FA"
        inst.ultimo_erro = "Autenticação de dois fatores necessária. Insira o código 2FA."
        # NÃO salvar sessão — login incompleto. Manter apenas device settings.
        inst._salvar_device_settings()
        raise HTTPException(status_code=428, detail="2FA necessário. Envie verification_code.", headers={"X-Instagram-Reason": "2fa"})
    except ChallengeRequired:
        inst.status = "CHALLENGE"
        _registar_challenge(nome_validado)
        cooldown_restante = int((_challenge_cooldown.get(nome_validado, 0) - time.time()) / 60)
        inst.ultimo_erro = (
            f"Instagram pede verificação de segurança (tentativa #{_challenge_count.get(nome_validado, 1)}). "
            f"Cooldown: {cooldown_restante}min. "
            f"Resolva o challenge no app do Instagram e tente novamente depois."
        )
        raise HTTPException(
            status_code=428,
            detail=inst.ultimo_erro,
            headers={"X-Instagram-Reason": "challenge"},
        )
    except BadPassword:
        inst.status = "ERRO"
        inst.ultimo_erro = "Password incorrecta."
        raise HTTPException(status_code=401, detail="Password incorrecta.")
    except Exception as e:
        inst.status = "ERRO"
        inst.ultimo_erro = str(e)[:500]
        raise HTTPException(status_code=500, detail=f"Erro de login: {str(e)[:200]}")

    return {
        "ok": True,
        "instancia": nome_validado,
        "username": req.username,
        "user_id": str(inst.client.user_id),
        "status": inst.status,
        "metodo": "login_fresco",
    }


@app.post("/send-dm")
async def send_dm(req: SendDmRequest, authorization: str | None = Header(None), x_bridge_token: str | None = Header(None)):
    verificar_token(authorization, x_bridge_token)

    inst = instancias.get(req.instancia)
    if not inst or inst.status != "CONECTADA":
        raise HTTPException(status_code=400, detail="Instância não conectada.")

    if not req.user_id and not req.username:
        raise HTTPException(status_code=400, detail="Forneça user_id ou username.")

    loop = asyncio.get_event_loop()
    try:
        user_id = req.user_id
        if not user_id and req.username:
            user_info = await loop.run_in_executor(
                None, lambda: inst.client.user_info_by_username(req.username)
            )
            user_id = str(user_info.pk)

        if req.text:
            result = await loop.run_in_executor(
                None, lambda: inst.client.direct_send(req.text, [int(user_id)])
            )
        elif req.media_url:
            async with httpx.AsyncClient() as client:
                resp = await client.get(req.media_url)
                tmp_path = SESSIONS_DIR / f"tmp_media_{int(time.time())}.jpg"
                tmp_path.write_bytes(resp.content)

            result = await loop.run_in_executor(
                None, lambda: inst.client.direct_send_photo(str(tmp_path), [int(user_id)])
            )
            tmp_path.unlink(missing_ok=True)
        else:
            raise HTTPException(status_code=400, detail="Forneça text ou media_url.")

        msg_id = str(getattr(result, "id", "")) if result else f"ig_{int(time.time())}"

        await emitir_webhook("INSTAGRAM_DM_SENT", {
            "instancia": req.instancia,
            "negocioId": inst.negocio_id,
            "messageId": msg_id,
            "userId": user_id,
            "username": req.username or "",
            "text": req.text or "",
        })

        return {"ok": True, "messageId": msg_id, "userId": user_id}

    except LoginRequired:
        inst.status = "SESSAO_EXPIRADA"
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar DM: {str(e)[:300]}")


@app.post("/profile")
async def get_profile(req: ProfileRequest, authorization: str | None = Header(None), x_bridge_token: str | None = Header(None)):
    verificar_token(authorization, x_bridge_token)

    inst = instancias.get(req.instancia)
    if not inst or inst.status != "CONECTADA":
        raise HTTPException(status_code=400, detail="Instância não conectada.")

    loop = asyncio.get_event_loop()
    try:
        user = await loop.run_in_executor(
            None, lambda: inst.client.user_info_by_username(req.username)
        )
        return {
            "ok": True,
            "user_id": str(user.pk),
            "username": user.username,
            "full_name": user.full_name,
            "biography": user.biography,
            "follower_count": user.follower_count,
            "following_count": user.following_count,
            "media_count": user.media_count,
            "profile_pic_url": str(user.profile_pic_url or ""),
            "is_private": user.is_private,
            "is_verified": user.is_verified,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar perfil: {str(e)[:300]}")


@app.get("/status")
async def list_status(authorization: str | None = Header(None), x_bridge_token: str | None = Header(None)):
    verificar_token(authorization, x_bridge_token)

    result = []
    for nome, inst in instancias.items():
        cooldown = None
        if nome in _challenge_cooldown:
            restante = _challenge_cooldown[nome] - time.time()
            cooldown = max(0, int(restante))

        result.append(StatusResponse(
            instancia=nome,
            username=inst.username,
            status=inst.status,
            ultimo_erro=inst.ultimo_erro,
            ultima_poll_em=inst.ultima_poll_em.isoformat() if inst.ultima_poll_em else None,
            challenge_cooldown_restante=cooldown,
        ))

    return {"instancias": result}


@app.post("/logout")
async def logout(instancia: str, authorization: str | None = Header(None), x_bridge_token: str | None = Header(None)):
    verificar_token(authorization, x_bridge_token)

    inst = instancias.pop(instancia, None)
    if not inst:
        raise HTTPException(status_code=404, detail="Instância não encontrada.")

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, inst.client.logout)
    except Exception:
        pass

    # Apagar sessão mas MANTER device settings para próximo login
    inst.session_path.unlink(missing_ok=True)
    _limpar_challenge(instancia)
    return {"ok": True, "instancia": instancia}


@app.post("/clear-challenge")
async def clear_challenge(instancia: str, authorization: str | None = Header(None), x_bridge_token: str | None = Header(None)):
    """Limpar cooldown manualmente (após resolver challenge no app do Instagram)."""
    verificar_token(authorization, x_bridge_token)
    _limpar_challenge(instancia)
    return {"ok": True, "instancia": instancia, "message": "Cooldown limpo. Pode tentar login novamente."}
