
import logging
from utils.text_cleaning import clean_text
from nlp.spell_corrector import fuzzy_score, correct_query
from nlp.synonym_expander import expand_query
from nlp.similarity import semantic_scores, normalize_scores
from nlp.embedding_model import get_model

log = logging.getLogger(__name__)

WEIGHT_FUZZY    = 0.3
WEIGHT_SEMANTIC = 0.7


def run_pipeline(query: str, paragraphs: list[str]) -> dict:
    log.info("Pipeline started  query=%r  paragraphs=%d", query, len(paragraphs))

    # Step 1 — clean
    clean_query = clean_text(query)
    log.debug("Step 1 clean:    %r → %r", query, clean_query)

    # Step 2 — spell correct against article vocabulary
    vocab = list(set(
        word
        for p in paragraphs
        for word in clean_text(p).split()
    ))
    corrected_query = correct_query(clean_query, vocab)
    log.debug("Step 2 corrected: %r → %r", clean_query, corrected_query)

    # Step 3 — synonym expand
    expanded_query = expand_query(corrected_query)
    log.debug("Step 3 expanded:  %r → %r", corrected_query, expanded_query)

    # Step 4 — fuzzy scores
    raw_fuzz = [
        fuzzy_score(corrected_query, clean_text(p))
        for p in paragraphs
    ]
    fuzz_scores = normalize_scores(raw_fuzz)
    log.debug("Step 4 fuzzy (normalised): %s", [round(s, 3) for s in fuzz_scores])

    # Step 5 — semantic scores
    raw_sem   = semantic_scores(expanded_query, paragraphs)
    sem_scores = normalize_scores(raw_sem)
    log.debug("Step 5 semantic (normalised): %s", [round(s, 3) for s in sem_scores])

    # Step 6 — weighted combination
    combined = [
        round(WEIGHT_FUZZY * f + WEIGHT_SEMANTIC * s, 4)
        for f, s in zip(fuzz_scores, sem_scores)
    ]
    log.debug("Step 6 combined: %s", [round(s, 3) for s in combined])

    # Step 7 — rank
    ranked_indices = sorted(
        range(len(combined)),
        key=lambda i: combined[i],
        reverse=True
    )

    # Step 8 — build scored list for response
    scores = [
        {
            "index":    i,
            "fuzzy":    round(fuzz_scores[i], 4),
            "semantic": round(sem_scores[i], 4),
            "combined": combined[i],
        }
        for i in ranked_indices
    ]

    log.info(
        "Pipeline complete. Top match → index %d  score %.4f",
        ranked_indices[0], combined[ranked_indices[0]]
    )

    return {
        "rankedIndices": ranked_indices,
        "scores":        scores,
        "meta": {
            "originalQuery":  query,
            "cleanedQuery":   clean_query,
            "correctedQuery": corrected_query,
            "expandedQuery":  expanded_query,
        }
    }