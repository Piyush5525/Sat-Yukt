"""
Twilio WhatsApp webhook: receives inbound messages, runs them through the same
verify_claim() pipeline used by the website's /verify endpoint, and replies
with the verdict as a WhatsApp message via TwiML.

Twilio sends inbound messages as application/x-www-form-urlencoded POST data
(not JSON) — see https://www.twilio.com/docs/messaging/guides/webhook-request.
"""

import logging
import os

from fastapi import APIRouter, Depends, Form, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from twilio.request_validator import RequestValidator
from twilio.twiml.messaging_response import MessagingResponse

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


def _format_reply(verdict: str, confidence: int, explanation: str, source_name: str, source_url: str) -> str:
    label = VERDICT_LABELS.get(verdict, verdict.upper())
    lines = [f"{label} ({confidence}% confidence)", "", explanation]
    if source_name:
        lines.append("")
        lines.append(f"Source: {source_name}")
        if source_url:
            lines.append(source_url)
    return "\n".join(lines)


def _is_valid_twilio_request(request: Request, form_data: dict) -> bool:
    """
    Verifies the request actually came from Twilio using the shared auth
    token, per https://www.twilio.com/docs/usage/webhooks/webhooks-security.
    Skipped (returns True) if TWILIO_AUTH_TOKEN isn't configured, so local
    dev/testing without Twilio credentials still works.
    """
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    if not auth_token:
        return True

    validator = RequestValidator(auth_token)
    signature = request.headers.get("X-Twilio-Signature", "")
    url = str(request.url)
    return validator.validate(url, form_data, signature)


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    Body: str = Form(default=""),
    From: str = Form(default=""),
    db: Session = Depends(get_db),
) -> Response:
    form_data = dict(await request.form())

    if not _is_valid_twilio_request(request, form_data):
        logger.warning("Rejected WhatsApp webhook request with invalid Twilio signature.")
        return Response(status_code=403)

    text = Body.strip()
    reply = MessagingResponse()

    if not text:
        reply.message(WELCOME_MESSAGE)
        return Response(content=str(reply), media_type="application/xml")

    logger.info("WhatsApp message from %s: %r", From, text)

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
    reply.message(reply_text)

    return Response(content=str(reply), media_type="application/xml")
