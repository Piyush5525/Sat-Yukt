import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String

from db import Base


def _new_uuid() -> str:
    return str(uuid.uuid4())


class Claim(Base):
    __tablename__ = "claims"

    id = Column(String, primary_key=True, default=_new_uuid)
    text = Column(String, nullable=False)
    language = Column(String, nullable=False)
    mode = Column(String, nullable=False)
    verdict = Column(String, nullable=False)
    confidence = Column(Integer, nullable=False)
    explanation = Column(String, nullable=False)
    source_name = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    flag_count = Column(Integer, default=0, nullable=False)
