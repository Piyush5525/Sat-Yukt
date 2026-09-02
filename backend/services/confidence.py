"""
Sat-Yukt AI Layer — Confidence Scoring

Confidence is deliberately derived from embedding similarity, not a
trained ML classifier. This is an intentional prototype simplification
— state this proactively in the pitch/demo, do not wait to be asked.
"""


def compute_confidence(similarity_score: float, verdict: str) -> int:
    """
    similarity_score: cosine similarity from ClaimRetriever.retrieve(),
        in range [0.0, 1.0]. Pass the raw score even for the
        unverifiable case (score below threshold) — this function
        handles capping.
    verdict: one of "true" | "false" | "misleading" | "unverifiable"

    Returns an integer confidence 0-100.
    """
    if verdict == "unverifiable":
        # Always capped low, regardless of how close the near-miss was.
        return min(int(similarity_score * 60), 34)

    # Scale similarity in the "confident match" range (threshold..1.0)
    # up to a 50-95 confidence range. Assumes threshold ~0.50 — if you
    # change DEFAULT_THRESHOLD in retrieval.py, update the 0.50 below
    # to match.
    threshold = 0.50
    scaled = max(0.0, (similarity_score - threshold) / (1.0 - threshold))
    return int(50 + scaled * 45)
