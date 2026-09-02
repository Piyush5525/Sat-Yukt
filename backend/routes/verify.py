import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from db import get_db
from models.db_models import Claim
from models.schemas import (
    FlagRequest,
    FlagResponse,
    RecentClaim,
    VerifyRequest,
    VerifyResponse,
)
from services.verify_service import verify_claim

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/verify", response_model=VerifyResponse)
async def verify(payload: VerifyRequest, db: Session = Depends(get_db)) -> VerifyResponse:
    result = await verify_claim(
        text=payload.text, language=payload.language, mode=payload.mode, db=db
    )
    return VerifyResponse(
        claim_id=result.claim_id,
        verdict=result.verdict,
        confidence=result.confidence,
        explanation=result.explanation,
        source_name=result.source_name,
        source_url=result.source_url,
    )


@router.post("/flag", response_model=FlagResponse)
async def flag(payload: FlagRequest, db: Session = Depends(get_db)) -> FlagResponse:
    claim = db.query(Claim).filter(Claim.id == payload.claim_id).first()
    if claim is None:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim.flag_count = (claim.flag_count or 0) + 1
    db.commit()
    return FlagResponse(status="ok")


@router.get("/recent-claims", response_model=list[RecentClaim])
async def recent_claims(db: Session = Depends(get_db)) -> list[RecentClaim]:
    claims = (
        db.query(Claim)
        .order_by(desc(Claim.created_at))
        .limit(20)
        .all()
    )
    return [
        RecentClaim(
            claim_text=c.text,
            verdict=c.verdict,
            confidence=c.confidence,
            timestamp=c.created_at.isoformat(),
        )
        for c in claims
    ]
