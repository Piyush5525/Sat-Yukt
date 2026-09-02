import logging
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(level=logging.INFO)

from db import init_db  # noqa: E402  (after load_dotenv, so DATABASE_URL is available)
from routes.verify import router as verify_router  # noqa: E402
from routes.whatsapp import router as whatsapp_router  # noqa: E402
from routes.whatsapp_greenapi import router as whatsapp_greenapi_router  # noqa: E402
from services import verify_service  # noqa: E402

app = FastAPI(title="Sat-Yukt API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    # Pre-load the AI layer's retriever (embedding model + dataset) now
    # rather than on the first request. Loading it lazily can take 10+
    # seconds on a cold start, which alone can blow past the /verify
    # timeout budget for that first request.
    verify_service.preload_retriever()


app.include_router(verify_router)
app.include_router(whatsapp_router)
app.include_router(whatsapp_greenapi_router)


@app.get("/")
async def root() -> dict:
    return {"status": "ok", "service": "sat-yukt-api"}
