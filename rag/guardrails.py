from __future__ import annotations

import re
from typing import Dict, List

UNSAFE_TOKENS = {'bomb', 'kill', 'hack', 'attack', 'weapon', 'self-harm'}
OFFTOPIC_TOPICS = {'weather', 'stocks', 'sports', 'politics', 'recipe'}


def _contains_word(text: str, keyword: str) -> bool:
    pattern = rf'(?<![A-Za-z0-9]){re.escape(keyword)}(?![A-Za-z0-9])'
    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def guardrail_check(query: str, context: List[str]) -> Dict[str, object]:
    normalized = query.lower()
    reasons: List[str] = []
    safe = True

    if any(_contains_word(normalized, term) for term in UNSAFE_TOKENS):
        safe = False
        reasons.append('unsafe_content')

    if not context:
        safe = False
        reasons.append('not_enough_context')

    if any(_contains_word(normalized, topic) for topic in OFFTOPIC_TOPICS):
        reasons.append('off_topic')

    groundedness = 0.95 if context else 0.0
    confidence = min(0.99, max(0.10, groundedness - (0.1 if reasons else 0.0)))

    return {
        'safe': safe and not bool(reasons),
        'confidence': round(confidence, 2),
        'reasons': reasons,
        'groundedness': round(groundedness, 2),
        'requires_human_review': not safe,
    }
