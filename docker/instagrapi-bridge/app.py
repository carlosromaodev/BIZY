"""
Instagrapi Bridge — microserviço que encapsula a instagrapi (API privada do Instagram)
e expõe endpoints REST para o backend Node do Bizy.

Funcionalidades:
- Login com username/password (salva sessão em disco)
- Polling de DMs novas (envia webhook ao backend)
- Envio de DMs (texto e media)
- Consulta de perfil de utilizador
"""

import asyncio
import hashlib
import json
import logging
import os
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

logger = logging.getLogger("instagrapi-bridge")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# ---------------------------------------------------------------------------
# State — uma instância por conta Instagram (multi-tenant via instancia name)
# ---------------------------------------------------------------------------

instancias: dict[str, "InstanciaInstagram"] = {}
poll_task: asyncio.Task | None = None


class InstanciaInstagram:
    def __init__(self, nome: str, username: str):
        self.nome = nome
        self.username = username
        self.client = InstaClient()
        self.client.delay_range = [2, 5]
        self.status = "CRIADA"
        self.ultimo_erro: str | None = None
        self.ultima_poll_em: datetime | None = None
        self.mensagens_vistas: set[str] = set()
        self.negocio_id: str | None = None

    @property
    def session_path(self) -> Path:
        return SESSIONS_DIR / f"{self.nome}.json"

    def salvar_sessao(self):
        SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
        settings = self.client.get_settings()
        self.session_path.write_text(json.dumps(settings, default=str))

    def carregar_sessao(self) -> bool:
        if not self.session_path.exists():
            return False
        try:
            settings = json.loads(self.session_path.read_text())
            self.client.set_settings(settings)
            self.client.login(self.username, "")  # relogin from session
            return True
        except Exception:
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
    threads = await loop.run_in_executor(None, _fetch_direct_threads, inst)

    for thread in threads:
        for message in thread.messages:
            msg_id = str(message.id)
            if msg_id in inst.mensagens_vistas:
                continue
            inst.mensagens_vistas.add(msg_id)

            # Limitar set para evitar crescimento infinito
            if len(inst.mensagens_vistas) > 10_000:
                # Remover as mais antigas (set não é ordenado, mas é suficiente)
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
    """Resolve username e nome do remetente a partir dos users do thread."""
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
    poll_task = asyncio.create_task(poll_dms())
    logger.info("Instagrapi Bridge iniciado. Poll interval: %ds", POLL_INTERVAL)
    yield
    if poll_task:
        poll_task.cancel()
    global http_client
    if http_client:
        await http_client.aclose()


app = FastAPI(title="Instagrapi Bridge", version="1.0.0", lifespan=lifespan)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "instancias": len(instancias),
        "activas": sum(1 for i in instancias.values() if i.status == "CONECTADA"),
    }


@app.post("/login")
async def login(req: LoginRequest, authorization: str | None = Header(None), x_bridge_token: str | None = Header(None)):
    verificar_token(authorization, x_bridge_token)

    inst = instancias.get(req.instancia)
    if not inst:
        inst = InstanciaInstagram(req.instancia, req.username)
        instancias[req.instancia] = inst

    inst.username = req.username
    inst.negocio_id = req.negocio_id

    loop = asyncio.get_event_loop()
    try:
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
        logger.info("Login bem-sucedido: %s (%s)", req.instancia, req.username)
    except TwoFactorRequired:
        inst.status = "AGUARDANDO_2FA"
        inst.ultimo_erro = "Autenticação de dois fatores necessária."
        raise HTTPException(status_code=428, detail="2FA necessário. Envie verification_code.")
    except ChallengeRequired:
        inst.status = "CHALLENGE"
        inst.ultimo_erro = "Instagram pede verificação de segurança."
        raise HTTPException(status_code=428, detail="Challenge de segurança do Instagram. Verifique o app ou email.")
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
        "instancia": req.instancia,
        "username": req.username,
        "user_id": str(inst.client.user_id),
        "status": inst.status,
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
            # Baixar media e enviar como foto
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

    return {
        "instancias": [
            StatusResponse(
                instancia=nome,
                username=inst.username,
                status=inst.status,
                ultimo_erro=inst.ultimo_erro,
                ultima_poll_em=inst.ultima_poll_em.isoformat() if inst.ultima_poll_em else None,
            )
            for nome, inst in instancias.items()
        ]
    }


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

    inst.session_path.unlink(missing_ok=True)
    return {"ok": True, "instancia": instancia}
