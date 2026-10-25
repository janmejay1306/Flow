from __future__ import annotations

import statistics
import time
from typing import Dict, List

from rag.harness import RAGHarness


QUERIES = [
    'What is Hacker House Goa 2026 about?',
    'How should voice products handle retrieval and safety?',
    'What is a good RAG workflow for builders?',
    'How do you keep latency low in a demo pipeline?',
    'What does guardrailed answer generation mean?',
    'How do Hindi and English retrieval stacks compare?',
    'What is hybrid dense sparse search?',
    'How can metadata-aware chunking help?',
    'What are the best low-latency AI product patterns?',
    'How should a system respond when there is not enough context?',
]


def run_benchmark() -> Dict[str, float]:
    harness = RAGHarness()
    samples: List[float] = []

    for q in QUERIES:
        start = time.perf_counter()
        harness.query(q)
        elapsed = (time.perf_counter() - start) * 1000
        samples.append(elapsed)

    return {
        'p50': statistics.median(samples),
        'p70': statistics.quantiles(samples, n=100)[69],
        'p100': max(samples),
        'average': sum(samples) / len(samples),
    }


if __name__ == '__main__':
    result = run_benchmark()
    print('Benchmark results:')
    for key, value in result.items():
        print(f'{key}: {round(value, 2)}ms')
