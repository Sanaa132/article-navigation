from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from contextlib import asynccontextmanager
import logging

from nlp.pipeline import run_pipeline
from nlp.embedding_model import get_model

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
log = logging.getLogger(__name__)


# ── Startup: preload model ───────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Loading embedding model…")
    get_model()
    log.info("Embedding model ready.")
    yield
    log.info("Shutting down.")


app = FastAPI(
    title="Article Navigator – NLP Server",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ── Models ───────────────────────────────────────────────────────────────────
class RankRequest(BaseModel):
    query: str
    paragraphs: list[str]

    @validator("query")
    def query_not_empty(cls, v):
        if not v.strip():
            raise ValueError("query must not be empty")
        return v

    @validator("paragraphs")
    def paragraphs_not_empty(cls, v):
        if not v:
            raise ValueError("paragraphs list must not be empty")
        return v


class ScoredParagraph(BaseModel):
    index: int
    fuzzy: float
    semantic: float
    combined: float


class RankResponse(BaseModel):
    rankedIndices: list[int]
    scores: list[ScoredParagraph]


# ── Endpoint ─────────────────────────────────────────────────────────────────
@app.post("/rank", response_model=RankResponse)
def rank(request: RankRequest):
    try:
        result = run_pipeline(request.query, request.paragraphs)

        return RankResponse(
            rankedIndices=result["rankedIndices"],
            scores=result["scores"]
        )

    except Exception as e:
        log.error("Pipeline failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}