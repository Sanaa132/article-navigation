
from rapidfuzz import fuzz, process

def fuzzy_score(query: str, paragraph: str) -> float:
    return fuzz.partial_ratio(query, paragraph) / 100.0


def correct_query(query: str, vocabulary: list[str]) -> str:
    if not vocabulary:
        return query

    words = query.split()
    corrected = []

    for word in words:
        match = process.extractOne(
            word,
            vocabulary,
            scorer=fuzz.ratio,
            score_cutoff=70
        )
        corrected.append(match[0] if match else word)

    return ' '.join(corrected)


def best_fuzzy_matches(query: str, paragraphs: list[str], top_n: int = 5) -> list[tuple[int, float]]:
    results = []

    for i, paragraph in enumerate(paragraphs):
        score = fuzz.partial_ratio(query, paragraph) / 100.0
        results.append((i, score))

    results.sort(key=lambda x: x[1], reverse=True)
    return results[:top_n]