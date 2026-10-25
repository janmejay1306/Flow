# HH Goa 2026 — Voice-Enabled RAG

A dark, high-signal voice-to-RAG demo built for Hacker House Goa 2026. The app demonstrates:

- Real microphone capture and live waveform UI
- Speech-to-text style transcription flow
- Advanced retrieval with semantic, fixed-size, metadata-aware, and hybrid retrieval strategies
- Guardrailed answer generation with not-enough-context fallback
- Latency analytics with P50 / P70 / P100 metrics

## Architecture

- Frontend: React + Vite + Tailwind in `frontend/`
- Backend: FastAPI in `backend/`
- Retrieval and orchestration: `rag/`
- Benchmarking scripts: `scripts/`

## Color system

The interface is intentionally dark and signal-first, matching the hhgoa.com direction:

- Background: `#0A0A0B`
- Surface: `#111113`
- Elevated: `#18181B`
- Border: `#27272A`
- Text: `#FAFAFA`
- Secondary text: `#A1A1AA`
- Accent cyan: `#22D3EE`
- Accent violet: `#A78BFA`
- Success green: `#34D399`

## Retrieval strategy

The harness uses a hybrid strategy that combines:

1. Semantic chunking for coherence
2. Fixed-size chunks with overlap for continuity
3. Metadata-aware indexing for language / source tags
4. Parent-child style document grouping for precision
5. Hybrid dense + sparse retrieval for resilient answers

The UI shows the active strategy per query, matching the technical stack requirements.

## Guardrails

The system blocks unsafe requests and off-topic answers, and it refuses to answer when evidence is insufficient.

Examples:

- Unsafe input: weapon / attack prompts
- Off-topic: recipe or weather requests
- Groundedness failure: no relevant context for the query

## Latency target

The demo is tuned to keep the end-to-end pipeline under 200ms through:

- compact indexing
- small retrieval footprint
- cached strategy selection
- low-overhead orchestration

## Local run

### 1. Backend

```bash
cd /path/to/HH
python -m pip install -r backend/requirements.txt
$env:PYTHONPATH='.'; python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

### 2. Frontend

```bash
cd /path/to/HH/frontend
npm install
npm run dev
```

### 3. Open the app

Visit `http://localhost:5173` and make sure the backend is running on port 8001.

## Current demo metrics

The UI and harness report a sample latency profile:

- P50: 122ms
- P70: 164ms
- P100: 198ms

## Benchmark script

```bash
cd /path/to/HH
PYTHONPATH=. python scripts/benchmark.py
```

This script runs a set of representative queries against the retrieval harness and prints rough timings for the pipeline.
