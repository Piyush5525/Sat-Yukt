"""
Sat-Yukt AI Layer — Main Orchestration Module, adapted from the AI layer
package with two disclosed changes from the original literal code:

1. The prompt file path was adjusted to fit this project's directory
   layout, and the LLM call retries transient 503s across a corrected,
   confirmed-working model candidate list (see ai_verify.GEMINI_MODEL_CANDIDATES).
2. When retrieval finds no evidence above the similarity threshold
   (matched_claim is None), this module now answers "unverifiable" LOCALLY
   without calling the LLM at all, instead of the original code's behavior
   of calling the LLM anyway and trusting master_prompt.txt's rule 1 ("if
   RETRIEVED_EVIDENCE is null, verdict MUST be unverifiable") to hold. This
   is a strictly stronger enforcement of that same hard rule — it can now
   never be violated by a model that ignores the instruction — and it also
   means a no-match query never costs an API call/quota unit. The returned
   shape (unverifiable, confidence < 35, null sources) is unchanged and
   still derived via confidence.py exactly as the LLM-answered path is.

Exposes verify_claim(text, language, retriever) matching the AI layer's
contract exactly. services/verify_service.py is the FastAPI-facing adapter
that calls this synchronously-but-in-a-thread, applies a timeout, and maps
its dict output onto the API's Pydantic response model.

DO NOT rewrite master_prompt.txt's rules section — only the
{claim_text}/{evidence_json_or_null} placeholders are filled in
programmatically.
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

from services.confidence import compute_confidence
from services.retrieval import ClaimRetriever

PROMPT_TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "data" / "master_prompt.txt"

with open(PROMPT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
    MASTER_PROMPT_TEMPLATE = f.read()

# Tried in order. Confirmed live against this account/API version:
# - gemini-flash-latest: works
# - gemini-2.5-flash, gemini-1.5-flash: 404, no longer available to new users
# - gemini-3.6-flash: 429, quota exceeded on this account's free tier
# Keep the deprecated ids listed after the working one (rather than removing
# them) so a future account/API-version change can still fall through to
# them automatically without a code change — 404s aren't retried, so they
# cost one fast failed call each, not meaningful latency.
GEMINI_MODEL_CANDIDATES = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.6-flash"]

# Gemini occasionally returns a transient 503 ("model is currently
# experiencing high demand") that clears up within seconds — retry each
# model candidate a couple of times with a short backoff before moving on,
# rather than treating a momentary spike as a hard failure.
MAX_ATTEMPTS_PER_MODEL = 3
RETRY_BACKOFF_SECONDS = 1.5


def _is_transient_error(exc: Exception) -> bool:
    message = str(exc)
    return "503" in message or "UNAVAILABLE" in message or "overloaded" in message.lower()


def call_llm(prompt: str) -> str:
    """
    Calls Google Gemini API. Reads API key from GEMINI_API_KEY environment
    variable. Tries several flash-tier model ids in order (since exact
    available model names shift over time and by account), retrying each a
    few times on a transient 503/overload before falling through to the
    next candidate.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")

    from google import genai

    client = genai.Client(api_key=api_key)

    last_err = None
    for model_name in GEMINI_MODEL_CANDIDATES:
        for attempt in range(1, MAX_ATTEMPTS_PER_MODEL + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if response and response.text:
                    return response.text
                last_err = ValueError(f"Empty response from model {model_name}")
                break  # empty response isn't transient — try the next model
            except Exception as e:  # noqa: BLE001 - retry transient errors, else try next model
                last_err = e
                if attempt < MAX_ATTEMPTS_PER_MODEL and _is_transient_error(e):
                    print(
                        f"[WARNING] Transient error from {model_name} "
                        f"(attempt {attempt}/{MAX_ATTEMPTS_PER_MODEL}): {e}. Retrying...",
                        file=sys.stderr,
                    )
                    time.sleep(RETRY_BACKOFF_SECONDS)
                    continue
                break  # non-transient error, or out of retries — try the next model
    raise last_err if last_err is not None else RuntimeError("All Gemini model candidates failed")


def build_prompt(claim_text: str, evidence: Optional[dict]) -> str:
    evidence_str = json.dumps(evidence, ensure_ascii=False) if evidence else "null"
    return MASTER_PROMPT_TEMPLATE.replace(
        "{claim_text}", claim_text
    ).replace(
        "{evidence_json_or_null}", evidence_str
    )


def verify_claim(
    text: str,
    language: str,
    retriever: ClaimRetriever,
) -> dict:
    """
    Main entry point. Matches the /verify endpoint's expected return
    shape from the build plan:

    {
      "verdict": "true" | "false" | "misleading" | "unverifiable",
      "confidence": int,
      "explanation": str,
      "source_name": str | None,
      "source_url": str | None
    }

    `text` should already be transcribed to text and translated to
    English if needed (that happens upstream, before this function is
    called).
    """
    fallback_response = {
        "verdict": "unverifiable",
        "confidence": 0,
        "explanation": "We could not check this claim right now. Please try again.",
        "source_name": None,
        "source_url": None,
    }

    try:
        matched_claim, similarity_score = retriever.retrieve(text)
    except Exception as e:  # noqa: BLE001 - retrieval failure degrades to a safe response
        print(f"[ERROR] verify_claim failure ({type(e).__name__}): {e}", file=sys.stderr)
        return fallback_response

    if matched_claim is None:
        # No evidence above the similarity threshold: this is a hard rule
        # (see master_prompt.txt rule 1 and retrieval.py's own contract) —
        # never call the LLM to guess without matching evidence. Answering
        # locally also means this path never costs an API call/quota unit.
        return {
            "verdict": "unverifiable",
            "confidence": compute_confidence(similarity_score, "unverifiable"),
            "explanation": (
                "We do not have official information to check this claim right now. "
                "Please be careful and do not share it until it can be confirmed."
            ),
            "source_name": None,
            "source_url": None,
        }

    try:
        prompt = build_prompt(text, matched_claim)
        raw_response = call_llm(prompt)
    except Exception as e:  # noqa: BLE001 - any pipeline failure degrades to a safe response
        print(f"[ERROR] verify_claim failure ({type(e).__name__}): {e}", file=sys.stderr)
        return fallback_response

    # Defensive parsing — Gemini/LLMs may return markdown fences or surrounding text
    cleaned = raw_response.strip()
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        cleaned = cleaned[start_idx : end_idx + 1]

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"[WARNING] Malformed LLM JSON output ({type(e).__name__}): {e}", file=sys.stderr)
        return fallback_response

    # Recompute confidence from the actual similarity score rather than
    # trusting whatever number the LLM put in the JSON — keeps the
    # confidence value honest and consistent with confidence.py's rules.
    result["confidence"] = compute_confidence(similarity_score, result.get("verdict", "unverifiable"))

    return result
