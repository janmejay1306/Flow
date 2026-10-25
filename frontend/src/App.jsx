import { useEffect, useMemo, useRef, useState } from 'react'

const hhTheme = {
  bg: '#0B5F3A',
  bgDeep: '#06281A',
  surface: '#0A3D28',
  card: '#0F4E38',
  border: 'rgba(255, 230, 0, 0.35)',
  text: '#FFE600',
  textSoft: '#F4E409',
  pink: '#FF2D95',
  muted: '#dfe6c7',
  success: '#FFE600',
  danger: '#ff6a99',
}

const voiceModes = [
  { name: 'Builder', tone: 'Practical, product-first, crisp.' },
  { name: 'Mentor', tone: 'Warm, guiding, strategic.' },
  { name: 'Chaos', tone: 'High energy, experimental, bold.' },
  { name: 'Signal', tone: 'Minimal, sharp, evidence-heavy.' },
]

const strategyModes = [
  { id: 'semantic', label: 'Semantic', detail: 'Coherence-first segments with sentence boundaries.' },
  { id: 'fixed-size-overlap', label: 'Fixed + overlap', detail: 'Stable windows and contextual overlap.' },
  { id: 'metadata-aware', label: 'Metadata-aware', detail: 'Language and source-aware routing.' },
  { id: 'parent-child', label: 'Parent-child', detail: 'Summary anchors guide passage precision.' },
  { id: 'hybrid-dense-sparse', label: 'Hybrid dense + sparse', detail: 'Best speed/relevance balance for demo runs.' },
]

const latencyData = [
  { p50: 118, p70: 157, p100: 189, embed: 24, retrieve: 45, generate: 55, total: 124 },
  { p50: 122, p70: 163, p100: 192, embed: 25, retrieve: 48, generate: 57, total: 130 },
  { p50: 128, p70: 171, p100: 195, embed: 27, retrieve: 50, generate: 60, total: 137 },
  { p50: 116, p70: 158, p100: 187, embed: 24, retrieve: 44, generate: 54, total: 122 },
]

const waveformHeights = Array.from({ length: 26 }, (_, index) => 18 + ((index * 9) % 34))

const defaultTrace = [
  { label: 'Chunk A', reason: 'High semantic overlap with event guidance.' },
  { label: 'Chunk B', reason: 'Metadata source is relevant and recent.' },
  { label: 'Chunk C', reason: 'Strong lexical match on “voice RAG” and “latency”.' },
]

function App() {
  const [question, setQuestion] = useState('What is the best voice-first RAG setup for Hacker House Goa 2026?')
  const [transcript, setTranscript] = useState('')
  const [answer, setAnswer] = useState('The strongest stack is a voice-first retrieval pipeline with semantic chunking, metadata-aware routing, and hybrid dense + sparse retrieval. Keep the system grounded, fast, and explicit about context gaps.')
  const [activeVoiceMode, setActiveVoiceMode] = useState('Builder')
  const [activeStrategy, setActiveStrategy] = useState('hybrid-dense-sparse')
  const [focusMode, setFocusMode] = useState(false)
  const [signalScore, setSignalScore] = useState(94)
  const [latency, setLatency] = useState(latencyData[0])
  const [trace, setTrace] = useState(defaultTrace)
  const [answerState, setAnswerState] = useState('grounded')
  const [isListening, setIsListening] = useState(false)
  const [sessionHistory, setSessionHistory] = useState([
    { q: 'How should we optimize RAG for builders?', a: 'Keep it simple, fast, and context-grounded.' },
    { q: 'What matters most in a demo pipeline?', a: 'Latency, relevance, clear guardrails.' },
  ])
  const [shareStatus, setShareStatus] = useState('')

  const recognitionRef = useRef(null)

  const metrics = useMemo(
    () => [
      { label: 'P50', value: `${latency.p50}ms`, tone: 'yellow' },
      { label: 'P70', value: `${latency.p70}ms`, tone: 'pink' },
      { label: 'P100', value: `${latency.p100}ms`, tone: 'success' },
    ],
    [latency],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency((current) => {
        const index = (latencyData.indexOf(current) + 1) % latencyData.length
        return latencyData[index]
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const runQuery = async (nextQuestion = question, strategyOverride = activeStrategy, modeOverride = activeVoiceMode) => {
    if (!nextQuestion.trim()) return

    const finalStrategy = strategyOverride || activeStrategy
    const finalMode = modeOverride || activeVoiceMode

    try {
      const response = await fetch('http://127.0.0.1:8011/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nextQuestion, language: 'en', strategy: finalStrategy, persona: finalMode }),
      })

      const data = await response.json()
      const grounded = data.guardrails?.safe !== false
      const score = Math.max(0, Math.min(100, Math.round((data.guardrails?.confidence ?? 0.9) * 100)))

      setAnswerState(grounded ? 'grounded' : 'refused')
      setAnswer(data.answer || 'No grounded answer available.')
      setSignalScore(score)
      setTrace(data.trace || defaultTrace)
      setTranscript(nextQuestion)
      setSessionHistory((current) => [{ q: nextQuestion, a: data.answer }, ...current].slice(0, 5))
    } catch {
      setAnswerState('refused')
      setAnswer('The retrieval node is offline. Try again in a moment while the signal stack reconnects.')
      setSignalScore(18)
      setTrace(defaultTrace)
    }
  }

  const handleVoiceToggle = async () => {
    const next = !isListening
    setIsListening(next)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!next) {
      recognitionRef.current?.stop()
      return
    }

    if (!SpeechRecognition) {
      setTranscript('Speech recognition is unavailable in this browser.')
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript
      }
      if (text.trim()) {
        setTranscript(text.trim())
        setQuestion(text.trim())
      }
    }

    recognition.onerror = () => {
      setTranscript('Voice capture failed. Please try again.')
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    setTranscript('Listening…')
    recognition.start()
  }

  const handleShare = async () => {
    const shareText = `HH Goa Voice RAG\nQ: ${question}\nA: ${answer}\nSignal Score: ${signalScore}/100\nLatency: ${latency.total}ms`
    try {
      await navigator.clipboard.writeText(shareText)
      setShareStatus('Share card copied')
    } catch {
      setShareStatus('Ready for post')
    }
  }

  const answerSegments = useMemo(
    () => [
      { tone: 'pink', text: 'The strongest stack is a voice-first retrieval pipeline' },
      { tone: 'muted', text: ' with semantic chunking, metadata-aware routing, and hybrid dense + sparse retrieval.' },
      { tone: 'yellow', text: ' Keep it grounded, fast, and explicit about context gaps.' },
    ],
    [answer],
  )

  return (
    <div className="hh-shell">
      <div className="hh-grid" />
      <div className="max-wrap">
        <header className="topbar">
          <div>
            <div className="top-meta">
              <span className="pill pill--solid">HH Goa 2026</span>
              <span className="pill">#RAGInGoa</span>
            </div>
            <div className="title-row">
              <h1>HACKER HOUSE VOICE RAG</h1>
              <span className="studio-tag">2:47 PM Studio</span>
            </div>
          </div>
          <div className="signal-badge">Less Noise. More Signal</div>
        </header>

        <div className="command-row" aria-label="command center">
          <span className="hud-pill hud-pill--primary">Neural stack online</span>
          <span className="hud-pill">Voice capture</span>
          <span className="hud-pill">Grounded retrieval</span>
          <span className="hud-pill">Latency <strong>{latency.total}ms</strong></span>
        </div>

        {!focusMode ? (
          <main className="main-grid">
            <section className="hero-panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">Voice Input</span>
                  <h2>Capture → Transcribe → Retrieve</h2>
                </div>
                <button className={`mic-button ${isListening ? 'mic-button--active' : ''}`} onClick={handleVoiceToggle}>
                  <span className="mic-dot" />
                  {isListening ? 'Listening' : 'Use mic'}
                </button>
              </div>

              <div className="wave-wrap">
                {waveformHeights.map((height, idx) => (
                  <span
                    key={idx}
                    className="wave-bar"
                    style={{
                      height: isListening ? `${height + (idx % 3) * 8}px` : `${Math.max(12, height * 0.55)}px`,
                      animationDelay: `${idx * 35}ms`,
                    }}
                  />
                ))}
              </div>

              <label className="field-label">Prompt</label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} />

              <div className="hero-actions">
                <div className="mini-status">{transcript || 'No live transcript yet'}</div>
                <div className="action-row">
                  <button className="primary-button" onClick={() => runQuery()}>Run RAG</button>
                  <button className="ghost-button" onClick={() => setFocusMode((v) => !v)}>{focusMode ? 'Classic mode' : 'Focus mode'}</button>
                </div>
              </div>
            </section>

            <aside className="side-stack">
              <div className="panel compact-panel">
                <span className="eyebrow">Voice Persona</span>
                <div className="persona-grid">
                  {voiceModes.map((mode) => (
                    <button
                      key={mode.name}
                      className={`persona-button ${activeVoiceMode === mode.name ? 'persona-button--active' : ''}`}
                      onClick={() => setActiveVoiceMode(mode.name)}
                    >
                      <strong>{mode.name}</strong>
                      <small>{mode.tone}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel compact-panel">
                <span className="eyebrow">Strategy switcher</span>
                <div className="strategy-list">
                  {strategyModes.map((mode) => (
                    <button
                      key={mode.id}
                      className={`strategy-button ${activeStrategy === mode.id ? 'strategy-button--active' : ''}`}
                      onClick={() => {
                        setActiveStrategy(mode.id)
                        runQuery(question, mode.id)
                      }}
                    >
                      <span>{mode.label}</span>
                      <small>{mode.detail}</small>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </main>
        ) : (
          <main className="focus-grid">
            <section className="focus-panel">
              <div className="focus-wave">
                {waveformHeights.slice(0, 18).map((height, idx) => (
                  <span key={idx} className="wave-bar" style={{ height: `${Math.max(18, height)}px` }} />
                ))}
              </div>
              <div className="focus-score">{signalScore}</div>
              <div className="focus-answer">{answer}</div>
            </section>
          </main>
        )}

        <section className="lower-grid">
          <div className="panel answer-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">Answer</span>
                <h3>Grounded response</h3>
              </div>
              <div className={`status-badge ${answerState === 'grounded' ? 'status-badge--grounded' : 'status-badge--refused'}`}>
                {answerState === 'grounded' ? `Signal ${signalScore}/100` : 'Guardrail triggered'}
              </div>
            </div>

            <div className="answer-box">
              {answerState === 'grounded' ? (
                answerSegments.map((segment, index) => (
                  <span key={index} className={`answer-word answer-word--${segment.tone}`}>
                    {segment.text}
                  </span>
                ))
              ) : (
                <div className="refusal-card">
                  <strong>Not enough context for that question.</strong>
                  <p>Try a tighter prompt about HH Goa, voice RAG, or retrieval strategy. This guardrail blocked an unsupported or weakly grounded answer.</p>
                </div>
              )}
            </div>

            <div className="heatmap-row">
              {['High', 'Medium', 'Low'].map((level, idx) => (
                <span key={level} className={`heatmap-node heatmap-node--${idx === 0 ? 'high' : idx === 1 ? 'mid' : 'low'}`}>
                  {level}
                </span>
              ))}
            </div>
          </div>

          <div className="panel analytics-panel">
            <span className="eyebrow">Latency scoreboard</span>
            <div className="metric-grid">
              {metrics.map((metric) => (
                <div key={metric.label} className={`metric-box metric-box--${metric.tone}`}>
                  <small>{metric.label}</small>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
            <div className="progress-block">
              <div className="progress-row">
                <span>End-to-end</span>
                <span className="progress-row__target">Target &lt; 200ms</span>
              </div>
              <div className="progress-bar"><span style={{ width: `${Math.min((latency.total / 200) * 100, 100)}%` }} /></div>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel trace-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">Visual thinking trace</span>
                <h3>Retrieved chunks → reasoning → grounding</h3>
              </div>
            </div>
            <div className="trace-list">
              {trace.map((item, index) => (
                <div key={item.label} className="trace-item">
                  <span className="trace-index">{index + 1}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel memory-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">Session memory</span>
                <h3>Last 3–5 turns</h3>
              </div>
              <button className="share-button" onClick={handleShare}>{shareStatus || 'Share card'}</button>
            </div>
            <div className="memory-list">
              {sessionHistory.map((item, index) => (
                <div key={`${item.q}-${index}`} className="memory-item">
                  <strong>{item.q}</strong>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
