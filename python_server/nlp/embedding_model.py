
import logging
from sentence_transformers import SentenceTransformer
import torch

log = logging.getLogger(__name__)

_model: SentenceTransformer | None = None
MODEL_NAME = "all-MiniLM-L6-v2"


def get_model() -> SentenceTransformer:
    global _model

    if _model is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        log.info("Loading model '%s' on %s…", MODEL_NAME, device.upper())
        _model = SentenceTransformer(MODEL_NAME, device=device)
        log.info("Model loaded successfully.")

    return _model


def encode(texts: list[str], batch_size: int = 32) -> list:
    model = get_model()

    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=False,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )

    return embeddings


def warmup():
    log.info("Running model warmup…")
    encode(["warmup sentence"])
    log.info("Warmup complete.")