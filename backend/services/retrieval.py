"""
Sat-Yukt AI Layer — Retrieval Module

Loads the curated claims dataset, builds sentence embeddings once at
startup, and performs similarity search against incoming user claims.

This module must be initialized ONCE when the backend starts (not per
request) — embedding the whole dataset on every call will add
unnecessary latency to every /verify call.

Usage:
    from services.retrieval import ClaimRetriever

    retriever = ClaimRetriever("data/claims.json")  # do this once at startup

    matched_claim, score = retriever.retrieve("some user claim text")
    if matched_claim is None:
        # no confident match -> route to "unverifiable" path
        ...
    else:
        # matched_claim is the full dict from claims.json
        # score is the cosine similarity (0.0 - 1.0)
        ...
"""

import json
from typing import Optional, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer

# Multilingual model — handles English, Hindi, and common code-mixed
# (Hinglish) input reasonably well without needing a GPU.
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

# Minimum cosine similarity required to treat a dataset entry as a
# real match. Below this, the query is treated as unmatched and the
# system MUST route to the "unverifiable" path. Tune this against
# real test queries before the demo — do not skip that step.
DEFAULT_THRESHOLD = 0.50


class ClaimRetriever:
    def __init__(self, dataset_path: str, threshold: float = DEFAULT_THRESHOLD):
        self.threshold = threshold
        self.model = SentenceTransformer(MODEL_NAME)

        with open(dataset_path, "r", encoding="utf-8") as f:
            self.claims = json.load(f)

        if not self.claims:
            raise ValueError(f"Dataset at {dataset_path} is empty.")

        texts = [c["claim_text"] for c in self.claims]
        # normalize_embeddings=True lets us use a plain dot product as
        # cosine similarity below.
        self.embeddings = self.model.encode(
            texts, normalize_embeddings=True, show_progress_bar=False
        )

    def retrieve(self, query: str) -> Tuple[Optional[dict], float]:
        """
        Returns (matched_claim_dict_or_None, similarity_score).

        If similarity_score < self.threshold, the first element is
        None and the caller MUST treat this as an unmatched /
        unverifiable case. Do not fall back to any other source of
        truth for the verdict in that case.
        """
        query_emb = self.model.encode([query], normalize_embeddings=True)[0]
        scores = self.embeddings @ query_emb  # cosine similarity per row
        best_idx = int(np.argmax(scores))
        best_score = float(scores[best_idx])

        if best_score < self.threshold:
            return None, best_score

        return self.claims[best_idx], best_score

    def reload(self, dataset_path: str):
        """Optional: call this if the dataset file is updated at runtime."""
        self.__init__(dataset_path, self.threshold)
