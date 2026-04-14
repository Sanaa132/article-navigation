
import nltk
from nltk.corpus import wordnet

nltk.download('wordnet', quiet=True)
nltk.download('omw-1.4', quiet=True)

def expand_query(query: str) -> str:
    words = query.split()
    expanded = set(words)

    for word in words:
        for syn in wordnet.synsets(word):
            for lemma in syn.lemmas():
                clean = lemma.name().replace('_', ' ').lower()
                expanded.add(clean)

    return ' '.join(expanded)