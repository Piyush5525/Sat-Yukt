"""
Green API WhatsApp webhook: receives inbound messages, runs them through the
same verify_claim() pipeline used by the website's /verify endpoint, and
sends the verdict back as a WhatsApp reply via Green API's send-message
endpoint.

Unlike Twilio, Green API does not accept a reply inline in the webhook
response — the reply must be sent as a separate outbound API call. See
https://green-api.com/en/docs/api/receiving/notifications-format/ for the
incoming webhook shape, and
https://green-api.com/en/docs/api/sending/SendMessage/ for sending.
"""

import logging
import os
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from db import get_db
from services.verify_service import verify_claim

logger = logging.getLogger(__name__)

router = APIRouter()

VERDICT_LABELS = {
    "true": "✅ TRUE",
    "misleading": "⚠️ MISLEADING",
    "false": "❌ FALSE",
    "unverifiable": "❓ UNVERIFIABLE",
}

WELCOME_MESSAGE = (
    "Hi! I'm Sat-Yukt. Send me any message you're not sure about — a forward, "
    "a scheme, a rumour — and I'll check it for you."
)

SEND_TIMEOUT_SECONDS = 10


def _format_reply(verdict: str, confidence: int, explanation: str, source_name: str, source_url: str) -> str:
    label = VERDICT_LABELS.get(verdict, verdict.upper())
    lines = [f"{label} ({confidence}% confidence)", "", explanation]
    if source_name:
        lines.append("")
        lines.append(f"Source: {source_name}")
        if source_url:
            lines.append(source_url)
    return "\n".join(lines)


def _get_credentials() -> Optional[tuple]:
    id_instance = os.getenv("GREEN_API_ID_INSTANCE")
    token_instance = os.getenv("GREEN_API_TOKEN_INSTANCE")
    if not id_instance or not token_instance:
        logger.warning("GREEN_API_ID_INSTANCE / GREEN_API_TOKEN_INSTANCE not configured.")
        return None
    return id_instance, token_instance


async def _send_whatsapp_message(chat_id: str, message: str) -> None:
    """
    Sends a WhatsApp message via Green API. Failures are logged, not raised —
    a failed reply shouldn't crash the webhook handler or cause Green API to
    retry-storm us; the claim is already verified and persisted regardless.
    """
    credentials = _get_credentials()
    if credentials is None:
        return
    id_instance, token_instance = credentials

    url = f"https://api.green-api.com/waInstance{id_instance}/sendMessage/{token_instance}"
    payload = {"chatId": chat_id, "message": message}

    try:
        async with httpx.AsyncClient(timeout=SEND_TIMEOUT_SECONDS) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
    except Exception as exc:  # noqa: BLE001 - a failed send shouldn't break the webhook
        logger.warning("Failed to send WhatsApp reply via Green API: %s", exc)


@router.post("/whatsapp/greenapi")
async def whatsapp_greenapi_webhook(request: Request, db: Session = Depends(get_db)) -> JSONResponse:
    try:
        payload = await request.json()
    except Exception:  # noqa: BLE001 - malformed webhook body, ignore rather than 500
        logger.warning("Received non-JSON body on /whatsapp/greenapi webhook.")
        return JSONResponse(content={"status": "ignored"})

    if payload.get("typeWebhook") != "incomingMessageReceived":
        # Green API also sends delivery-status and other webhook types we
        # don't care about here — acknowledge and ignore.
        return JSONResponse(content={"status": "ignored"})

    sender_data = payload.get("senderData", {})
    message_data = payload.get("messageData", {})
    chat_id = sender_data.get("chatId", "")

    text = (
        message_data.get("textMessageData", {}).get("textMessage")
        or message_data.get("extendedTextMessageData", {}).get("text")
        or ""
    ).strip()

    if not chat_id:
        logger.warning("Green API webhook missing chatId, cannot reply: %r", payload)
        return JSONResponse(content={"status": "ignored"})

    if not text:
        await _send_whatsapp_message(chat_id, WELCOME_MESSAGE)
        return JSONResponse(content={"status": "ok"})

    logger.info("WhatsApp (Green API) message from %s: %r", chat_id, text)

    # WhatsApp messages are always plain text the user typed — no ASR/OCR
    # step applies here, unlike the website's voice/photo modes.
    result = await verify_claim(text=text, language="en", mode="type", db=db)

    reply_text = _format_reply(
        verdict=result.verdict,
        confidence=result.confidence,
        explanation=result.explanation,
        source_name=result.source_name,
        source_url=result.source_url,
    )
    await _send_whatsapp_message(chat_id, reply_text)

    return JSONResponse(content={"status": "ok"})
