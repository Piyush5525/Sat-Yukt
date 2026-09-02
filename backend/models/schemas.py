from typing import Literal

from pydantic import BaseModel, Field

Verdict = Literal["true", "misleading", "false", "unverifiable"]
InputMode = Literal["voice", "photo", "type"]


class VerifyRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = Field(..., min_length=1)
    mode: InputMode


class VerifyResponse(BaseModel):
    claim_id: str
    verdict: Verdict
    confidence: int = Field(..., ge=0, le=100)
    explanation: str
    source_name: str
    source_url: str


class FlagRequest(BaseModel):
    claim_id: str = Field(..., min_length=1)


class FlagResponse(BaseModel):
    status: Literal["ok"]


class RecentClaim(BaseModel):
    claim_text: str
    verdict: str
    confidence: int
    timestamp: str
