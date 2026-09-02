"""
FastAPI-facing adapter around the Sat-Yukt AI layer (services/ai_verify.py).

verify_claim() is a plain async function with no HTTP/FastAPI dependencies so
it can be called directly from routes/verify.py today, and reused by the
WhatsApp webhook handlers without modification.

The AI layer's own verify_claim() (services/ai_verify.py) is synchronous and
blocking — it does local embedding + a live Gemini call inline. This module
runs it in a thread pool with a hard timeout so a slow/hung LLM call can
never stall the event loop or hang a request indefinitely.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from models.db_models import Claim
from services import ai_verify
from services.retrieval import ClaimRetriever

logger = logging.getLogger(__name__)

# The AI layer's pipeline (embed query + a live Gemini call, now with up to
# 3 retries on a transient 503 before falling through to the next model
# candidate) has been observed taking up to ~18s for a single successful LLM
# call, and Gemini's free tier has real, observed periods of 503s under load
# — give enough headroom for one retry cycle to complete rather than racing
# ai_verify.py's own retry/backoff logic and cutting it off mid-attempt.
EXTERNAL_CALL_TIMEOUT_SECONDS = 45

SERVICE_ERROR_EXPLANATION = (
    "We're having trouble checking this right now. Please try again in a moment."
)

_retriever: Optional[ClaimRetriever] = None


def get_retriever() -> ClaimRetriever:
    """
    Returns the module-level ClaimRetriever singleton, initializing it on
    first call. Call preload_retriever() at app startup so the first real
    request doesn't pay the model-load + embedding cost.
    """
    global _retriever
    if _retriever is None:
        import os

        dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "claims.json")
        logger.info("Initializing ClaimRetriever from %s ...", dataset_path)
        _retriever = ClaimRetriever(dataset_path)
        logger.info("ClaimRetriever ready with %d dataset entries.", len(_retriever.claims))
    return _retriever


def preload_retriever() -> None:
    """Force the retriever (and its embedding model) to load now. Call once at app startup."""
    get_retriever()


@dataclass
class VerdictResult:
    claim_id: str
    verdict: str
    confidence: int
    explanation: str
    source_name: str
    source_url: str


def _run_ai_layer_sync(text: str) -> dict:
    retriever = get_retriever()
    return ai_verify.verify_claim(text=text, language="en", retriever=retriever)


async def verify_claim(text: str, language: str, mode: str, db: Session) -> VerdictResult:
    """
    Run the AI layer's verification pipeline for a claim and persist the
    result.

    A plain async function with no HTTP/FastAPI dependencies (db is a
    SQLAlchemy Session, not a request object) so it can be called directly
    from routes/verify.py today, and reused by WhatsApp webhook handlers
    without modification.

    mode is "voice" | "photo" | "type". Note: any speech-to-text (ASR) or
    image OCR needed to produce `text` is assumed to have already happened
    upstream, in the frontend or an earlier pipeline stage — this function
    only ever reasons over plain text.
    TODO: when real audio/image inputs are wired up server-side (e.g. a
    WhatsApp webhook forwarding raw media), ASR/OCR extraction should happen
    before this call, not inside it.
    """
    try:
        ai_result = await asyncio.wait_for(
            asyncio.to_thread(_run_ai_layer_sync, text), timeout=EXTERNAL_CALL_TIMEOUT_SECONDS
        )
    except Exception as exc:  # noqa: BLE001 - timeout or unexpected failure degrades gracefully
        logger.warning("AI layer call failed or timed out: %s", exc)
        ai_result = {
            "verdict": "unverifiable",
            "confidence": 20,
            "explanation": SERVICE_ERROR_EXPLANATION,
            "source_name": None,
            "source_url": None,
        }

    verdict = ai_result.get("verdict") or "unverifiable"
    confidence = int(ai_result.get("confidence") or 0)
    explanation = ai_result.get("explanation") or SERVICE_ERROR_EXPLANATION
    # The AI layer returns None for source fields on unverifiable/error paths;
    # the API contract (models/schemas.py) requires plain strings.
    source_name = ai_result.get("source_name") or ""
    source_url = ai_result.get("source_url") or ""

    claim = Claim(
        text=text,
        language=language,
        mode=mode,
        verdict=verdict,
        confidence=confidence,
        explanation=explanation,
        source_name=source_name,
        source_url=source_url,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)

    return VerdictResult(
        claim_id=claim.id,
        verdict=claim.verdict,
        confidence=claim.confidence,
        explanation=claim.explanation,
        source_name=claim.source_name or "",
        source_url=claim.source_url or "",
    )
