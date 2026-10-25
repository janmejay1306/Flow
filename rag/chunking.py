from __future__ import annotations

import re
from typing import Any, Dict, List


def split_sentences(text: str) -> List[str]:
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+|\n+', text) if s.strip()]


def semantic_chunk(text: str, max_chars: int = 260) -> List[str]:
    sentences = split_sentences(text)
    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    for sentence in sentences:
        if current_len + len(sentence) + 1 <= max_chars:
            current.append(sentence)
            current_len += len(sentence) + 1
        else:
            if current:
                chunks.append(' '.join(current))
            current = [sentence]
            current_len = len(sentence)

    if current:
        chunks.append(' '.join(current))

    return chunks


def fixed_size_chunk(text: str, size: int = 220, overlap: int = 40) -> List[str]:
    if len(text) <= size:
        return [text]
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end].strip())
        start += size - overlap
    return [c for c in chunks if c]


def chunk_document(doc: Dict[str, Any], strategy: str = 'hybrid') -> List[Dict[str, Any]]:
    text = doc.get('text', '')
    if not text:
        return []

    chunks: List[Dict[str, Any]] = []
    semantic = semantic_chunk(text)
    fixed = fixed_size_chunk(text)

    if strategy in {'semantic', 'hybrid'}:
        base = semantic
    else:
        base = fixed

    for idx, piece in enumerate(base):
        chunks.append({
            'id': f"{doc.get('id', 'doc')}-{idx}",
            'text': piece,
            'language': doc.get('language', 'en'),
            'metadata': {
                'source': doc.get('source', 'unknown'),
                'title': doc.get('title', 'Document'),
                'category': doc.get('category', 'general'),
            },
            'strategy': strategy,
            'parent_id': doc.get('id', 'doc'),
        })

    if strategy == 'hybrid':
        for idx, piece in enumerate(fixed):
            chunks.append({
                'id': f"{doc.get('id', 'doc')}-fixed-{idx}",
                'text': piece,
                'language': doc.get('language', 'en'),
                'metadata': {
                    'source': doc.get('source', 'unknown'),
                    'title': doc.get('title', 'Document'),
                    'category': doc.get('category', 'general'),
                },
                'strategy': 'fixed-size-overlap',
                'parent_id': doc.get('id', 'doc'),
            })

    return chunks


def build_indexable_chunks(documents: List[Dict[str, Any]], strategy: str = 'hybrid') -> List[Dict[str, Any]]:
    all_chunks = []
    for doc in documents:
        all_chunks.extend(chunk_document(doc, strategy=strategy))
    return all_chunks
