
import logging
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from nlp.embedding_model import encode

log = logging.getLogger(__name__)


def semantic_scores(query: str, paragraphs: list[str]) -> list[float]:
    if not paragraphs:
        return []

    log.debug("Encoding query + %d paragraphs…", len(paragraphs))

    query_vec = encode([query])
    para_vecs = encode(paragraphs)

    scores = cosine_similarity(query_vec, para_vecs)[0]

    log.debug("Semantic scores: %s", np.round(scores, 3))

    return scores.tolist()


def top_semantic_matches(
    query: str,
    paragraphs: list[str],
    top_n: int = 5
) -> list[tuple[int, float]]:

    scores = semantic_scores(query, paragraphs)

    indexed = [(i, round(score, 4)) for i, score in enumerate(scores)]
    indexed.sort(key=lambda x: x[1], reverse=True)

    return indexed[:top_n]


def normalize_scores(scores: list[float]) -> list[float]:
    if not scores:
        return []

    arr = np.array(scores)
    min_val = arr.min()
    max_val = arr.max()

    if max_val == min_val:
        return [1.0] * len(scores)

    normalized = (arr - min_val) / (max_val - min_val)
    return normalized.tolist()
    