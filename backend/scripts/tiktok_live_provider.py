import asyncio
import json
import sys
from datetime import datetime, timezone


async def principal() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Informe o unique_id da live.")

    unique_id = sys.argv[1]
    if not unique_id.startswith("@"):
        unique_id = f"@{unique_id}"

    try:
        from TikTokLive import TikTokLiveClient
        from TikTokLive.events import CommentEvent
    except Exception as erro:
        print(json.dumps({"tipo": "erro", "mensagem": f"TikTokLive indisponível: {erro}"}), flush=True)
        raise

    cliente = TikTokLiveClient(unique_id=unique_id)

    @cliente.on(CommentEvent)
    async def ao_receber_comentario(evento):
        comentario = {
            "source": "tiktok",
            "provider": "tiktok-live-python",
            "liveId": f"tiktok_python_{unique_id.replace('@', '')}",
            "username": getattr(evento.user, "unique_id", ""),
            "displayName": getattr(evento.user, "nickname", ""),
            "commentText": getattr(evento, "comment", ""),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        print(json.dumps({"tipo": "comentario", "dados": comentario}, ensure_ascii=False), flush=True)

    await cliente.start()


if __name__ == "__main__":
    asyncio.run(principal())
