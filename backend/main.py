from __future__ import annotations

from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag.harness import RAGHarness

app = FastAPI(title='HHGoa Voice RAG API', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

harness = RAGHarness()


class QueryRequest(BaseModel):
    query: str
    language: Optional[str] = 'en'
    strategy: Optional[str] = 'hybrid-dense-sparse'
    persona: Optional[str] = 'Builder'


@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'hhgoa-rag'}


@app.post('/api/query')
def query(payload: QueryRequest):
    return harness.query(
        payload.query,
        language=payload.language,
        strategy=payload.strategy,
        persona=payload.persona,
    )


@app.get('/api/pipeline')
def pipeline():
    return {
        'name': 'voice-enabled-rag',
        'strategies': ['semantic', 'fixed-size-overlap', 'metadata-aware', 'parent-child', 'hybrid-dense-sparse'],
        'latency_target_ms': 200,
    }
