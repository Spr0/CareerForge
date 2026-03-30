import { useState, useRef } from "react";

function App() {
  const [resumeInput, setResumeInput] = useState("");
  const [jdInput, setJdInput] = useState("");
  const [result, setResult] = useState(null);

  const [selectedTrace, setSelectedTrace] = useState(null);
  const [selectedBullet, setSelectedBullet] = useState(null);

  const [changedBullet, setChangedBullet] = useState(null);
  const [changeInfo, setChangeInfo] = useState(null);

  const bulletRefs = useRef({});

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
    setChangeInfo(null);
  };

  const handleFix = async () => {
    if (!selectedBullet || !selectedTrace) return;

    const oldScore = result.analysis.score;

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

    // re-score
    const rescore = await fetch("/.netlify/functions/generate", {
      method: "POST",
      body: JSON.stringify({
        resume: resumeInput,
        requirements: extractRequirements(jdInput)
      })
    });

    const rescored = await rescore.json();

    const newScore = rescored.analysis.score;

    setResult({
      ...rescored,
      roles: updatedRoles
    });

    const key = `${selectedBullet.roleIndex}-${selectedBullet.bulletIndex}`;

    setChangedBullet(key);

    setChangeInfo({
      before: selectedBullet.text,
      after: data.rewritten,
      delta: (newScore - oldScore).toFixed(1)
    });

    // 🔥 scroll into view
    setTimeout(() => {
      bulletRefs.current[key]?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 100);
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
                    borderRadius: 6
                  }}
                >
                  {isSelected ? "🔘" : "⚪"} {req}
                </li>
              );
            })}
          </ul>

          {selectedTrace && (
            <div style={{ marginTop: 20 }}>
              <h4>Select a bullet</h4>

              {selectedTrace.evidence.map((e, i) => (
                <p
                  key={i}
                  onClick={() => setSelectedBullet(e)}
                  style={{
                    cursor: "pointer",
                    background:
                      selectedBullet === e ? "#e3f2fd" : "#f9f9f9",
                    padding: 6
                  }}
                >
                  • {e.text}
                </p>
              ))}

              <button
                onClick={handleFix}
                disabled={!selectedBullet}
                style={{ marginTop: 10 }}
              >
                🔧 Fix selected bullet
              </button>
            </div>
          )}

          {/* 🔥 CHANGE PANEL */}
          {changeInfo && (
            <div style={{
              marginTop: 20,
              padding: 10,
              border: "1px solid #ccc",
              background: "#fff8e1"
            }}>
              <h4>Updated</h4>
              <p><strong>Before:</strong> {changeInfo.before}</p>
              <p><strong>After:</strong> {changeInfo.after}</p>
              <p>Score change: {changeInfo.delta}</p>
            </div>
          )}

          <h3>Experience</h3>
          {result.roles.map((r, ri) => (
            <div key={ri}>
              <strong>{r.title}</strong>
              <ul>
                {r.bullets.map((b, bi) => {
                  const key = `${ri}-${bi}`;
                  return (
                    <li
                      key={bi}
                      ref={el => (bulletRefs.current[key] = el)}
                      style={{
                        background:
                          changedBullet === key
                            ? "#fff59d"
                            : "transparent",
                        transition: "0.3s"
                      }}
                    >
                      {b}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
