from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class RetrievalResult:
    chunk: Dict[str, Any]
    score: float


class InMemoryRetriever:
    def __init__(self, documents: List[Dict[str, Any]]) -> None:
        self.documents = documents
        self.vectorizer = None
        self.matrix = None
        self._fit()

    def _fit(self) -> None:
        texts = [item['text'] for item in self.documents]
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True, stop_words='english')
        self.matrix = self.vectorizer.fit_transform(texts)

    def search(self, query: str, top_k: int = 4) -> List[RetrievalResult]:
        if not query or self.vectorizer is None or self.matrix is None:
            return []

        query_vector = self.vectorizer.transform([query])
        sims = cosine_similarity(query_vector, self.matrix).flatten()
        indices = sims.argsort()[-top_k:][::-1]

        results = []
        for idx in indices:
            score = float(sims[idx])
            if score <= 0:
                continue
            results.append(RetrievalResult(chunk=self.documents[int(idx)], score=score))

        return results
