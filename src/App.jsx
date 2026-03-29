import { useState } from "react"
import {
  parseJD,
  generateResume
} from "./narrative_os_engine.js"

export default function App() {
  const [resume, setResume] = useState("")
  const [jd, setJd] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function callClaude(system, user) {
    try {
      const res = await fetch("/.netlify/functions/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, user })
      })

      const data = await res.json()
      return data?.text || ""
    } catch {
      return ""
    }
  }

  const handleGenerate = async () => {
    if (!resume || !jd) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const jdStruct = await parseJD(jd, callClaude)

      const output = await generateResume(
        resume,
        jd,
        [],
        jdStruct,
        callClaude
      )

      setResult(output)
    } catch (e) {
      setError("Generation failed")
    } finally {
      setLoading(false)
    }
  }

  // 🔥 NEW: Categorize results
  const getBreakdown = () => {
    if (!result?.keywords || !result?.explain?.semanticReasons) return null

    const matched = []
    const partial = []
    const missing = []

    result.keywords.forEach((req, i) => {
      const reason = result.explain.semanticReasons[i] || ""

      if (reason.toLowerCase().includes("strong")) {
        matched.push(req)
      } else if (
        reason.toLowerCase().includes("weak") ||
        reason.toLowerCase().includes("loose")
      ) {
        partial.push(req)
      } else {
        missing.push(req)
      }
    })

    return { matched, partial, missing }
  }

  const breakdown = getBreakdown()

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>NarrativeOS</h1>

      <textarea
        placeholder="Paste your resume"
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        rows={10}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <textarea
        placeholder="Paste job description"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={10}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Resume"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: 10 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20 }}>
          {result.reject && (
            <div style={{ color: "red", marginBottom: 10 }}>
              Low match — resume not generated
            </div>
          )}

          <div>
            <strong>Score:</strong> {result.bestScore}/10
          </div>

          <div>
            <strong>Coverage:</strong>{" "}
            {Math.round((result.explain?.coverage || 0) * 100)}%
          </div>

          {/* 🔥 NEW EXPLAINABILITY UI */}
          {breakdown && (
            <div style={{ marginTop: 20 }}>
              {breakdown.matched.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: "green" }}>Matched</strong>
                  <ul>
                    {breakdown.matched.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {breakdown.partial.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: "orange" }}>Partial</strong>
                  <ul>
                    {breakdown.partial.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {breakdown.missing.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: "red" }}>Missing</strong>
                  <ul>
                    {breakdown.missing.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <pre
            style={{
              whiteSpace: "pre-wrap",
              marginTop: 12,
              background: "#f6f6f6",
              padding: 12
            }}
          >
            {result.best}
          </pre>
        </div>
      )}
    </div>
  )
}
