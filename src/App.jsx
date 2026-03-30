import { useState } from "react";

function App() {
  const [resumeInput, setResumeInput] = useState("");
  const [jdInput, setJdInput] = useState("");
  const [result, setResult] = useState(null);

  const [selectedTrace, setSelectedTrace] = useState(null);
  const [selectedBullet, setSelectedBullet] = useState(null);

  function extractRequirements(text) {
    return text
      .split(/\n|•|\-|\./)
      .map(t => t.trim())
      .filter(t => t.length > 25)
      .slice(0, 8);
  }

  const handleGenerate = async () => {
    const res = await fetch("/.netlify/functions/generate", {
      method: "POST",
      body: JSON.stringify({
        resume: resumeInput,
        requirements: extractRequirements(jdInput)
      })
    });

    const data = await res.json();
    setResult(data);
    setSelectedTrace(null);
    setSelectedBullet(null);
  };

  const handleFix = async () => {
    if (!selectedBullet || !selectedTrace) return;

    const res = await fetch("/.netlify/functions/generate", {
      method: "POST",
      body: JSON.stringify({
        mode: "fix",
        bullet: selectedBullet.text,
        requirement: selectedTrace.requirement
      })
    });

    const data = await res.json();

    const updatedRoles = result.roles.map((r, ri) => ({
      ...r,
      bullets: r.bullets.map((b, bi) => {
        if (
          ri === selectedBullet.roleIndex &&
          bi === selectedBullet.bulletIndex
        ) {
          return data.rewritten;
        }
        return b;
      })
    }));

    setResult({
      ...result,
      roles: updatedRoles
    });
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>NarrativeOS</h1>

      <label><strong>Paste Resume</strong></label>
      <textarea
        rows={10}
        style={{ width: "100%", marginBottom: 10 }}
        value={resumeInput}
        onChange={(e) => setResumeInput(e.target.value)}
      />

      <label><strong>Paste Job Description</strong></label>
      <textarea
        rows={6}
        style={{ width: "100%", marginBottom: 10 }}
        value={jdInput}
        onChange={(e) => setJdInput(e.target.value)}
      />

      <button onClick={handleGenerate}>Analyze</button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h2>{result.header}</h2>
          <p>{result.summary}</p>

          <h3>Score: {result.analysis.score} / 10</h3>

          {/* 🔥 REQUIREMENTS WITH RADIO SELECT */}
          <h4>⚠️ Partial (select one)</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {result.analysis.partial.map((req) => {
              const traceItem = result.analysis.trace.find(
                t => t.requirement === req
              );

              const isSelected =
                selectedTrace?.requirement === req;

              return (
                <li
                  key={req}
                  onClick={() => {
                    setSelectedTrace(traceItem);
                    setSelectedBullet(null);
                  }}
                  style={{
                    cursor: "pointer",
                    marginBottom: 8,
                    padding: 8,
                    border: isSelected
                      ? "2px solid #0077ff"
                      : "1px solid #ddd",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 10
                  }}
                >
                  {/* 🔥 RADIO INDICATOR */}
                  <span>
                    {isSelected ? "🔘" : "⚪"}
                  </span>

                  <span>{req}</span>
                </li>
              );
            })}
          </ul>

          {/* TRACE PANEL */}
          {selectedTrace && (
            <div style={{ marginTop: 20 }}>
              <h4>Selected Requirement</h4>
              <p style={{ fontStyle: "italic" }}>
                {selectedTrace.requirement}
              </p>

              <h4>Select a bullet to improve</h4>

              {selectedTrace.evidence.map((e, i) => (
                <p
                  key={i}
                  onClick={() => setSelectedBullet(e)}
                  style={{
                    cursor: "pointer",
                    padding: 6,
                    marginBottom: 6,
                    background:
                      selectedBullet === e
                        ? "#e3f2fd"
                        : "#f9f9f9",
                    borderRadius: 4
                  }}
                >
                  • {e.text}
                </p>
              ))}

              <button
                onClick={handleFix}
                disabled={!selectedBullet}
                style={{
                  marginTop: 10,
                  background: selectedBullet ? "#0077ff" : "#ccc",
                  color: "white",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 4,
                  cursor: selectedBullet ? "pointer" : "not-allowed"
                }}
              >
                🔧 Fix selected bullet
              </button>
            </div>
          )}

          <h3>Experience</h3>
          {result.roles.map((r, i) => (
            <div key={i}>
              <strong>{r.title}</strong>
              <ul>
                {r.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
