import { useState } from "react";

function App() {
  const [resumeInput, setResumeInput] = useState("");
  const [jdInput, setJdInput] = useState("");
  const [result, setResult] = useState(null);

  const [selectedTrace, setSelectedTrace] = useState(null);

  const [mode, setMode] = useState("suggested"); // suggested | all | custom
  const [selectedBullet, setSelectedBullet] = useState(null);
  const [customBullet, setCustomBullet] = useState("");

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
    setCustomBullet("");
  };

  const handleFix = async () => {
    let bulletText = "";

    if (mode === "custom") {
      bulletText = customBullet;
    } else if (selectedBullet) {
      bulletText = selectedBullet.text;
    }

    if (!bulletText || !selectedTrace) return;

    const res = await fetch("/.netlify/functions/generate", {
      method: "POST",
      body: JSON.stringify({
        mode: "fix",
        bullet: bulletText,
        requirement: selectedTrace.requirement
      })
    });

    const data = await res.json();

    // replace if existing bullet
    let updatedRoles = result.roles;

    if (mode !== "custom") {
      updatedRoles = result.roles.map((r, ri) => ({
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
    }

    setResult({
      ...result,
      roles: updatedRoles
    });

    setSelectedBullet(null);
    setCustomBullet("");
  };

  const allBullets =
    result?.roles.flatMap((r, ri) =>
      r.bullets.map((b, bi) => ({
        text: b,
        roleIndex: ri,
        bulletIndex: bi
      }))
    ) || [];

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

      {result && result.analysis && (
        <div style={{ marginTop: 30 }}>
          <h2>{result.header}</h2>
          <p>{result.summary}</p>

          <h3>Score: {result.analysis.score} / 10</h3>

          {/* STEP 1 */}
          <h3>Step 1: Select requirement</h3>
          <ul>
            {result.analysis.partial.map(req => {
              const traceItem = result.analysis.trace.find(
                t => t.requirement === req
              );

              return (
                <li
                  key={req}
                  onClick={() => {
                    setSelectedTrace(traceItem);
                    setSelectedBullet(null);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {selectedTrace?.requirement === req ? "✔ " : "○ "}
                  {req}
                </li>
              );
            })}
          </ul>

          {/* STEP 2 */}
          {selectedTrace && (
            <div>
              <h3>Step 2: Choose how to improve</h3>

              <div style={{ marginBottom: 10 }}>
                <button onClick={() => setMode("suggested")}>
                  Suggested
                </button>
                <button onClick={() => setMode("all")}>
                  All bullets
                </button>
                <button onClick={() => setMode("custom")}>
                  Write your own
                </button>
              </div>

              {/* Suggested */}
              {mode === "suggested" &&
                selectedTrace.evidence.map((e, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedBullet(e)}
                    style={{
                      cursor: "pointer",
                      padding: 6,
                      background:
                        selectedBullet === e ? "#e3f2fd" : "#fafafa"
                    }}
                  >
                    {e.text}
                  </div>
                ))}

              {/* All bullets */}
              {mode === "all" &&
                allBullets.map((b, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedBullet(b)}
                    style={{
                      cursor: "pointer",
                      padding: 6,
                      background:
                        selectedBullet === b ? "#e3f2fd" : "#fafafa"
                    }}
                  >
                    {b.text}
                  </div>
                ))}

              {/* Custom */}
              {mode === "custom" && (
                <textarea
                  rows={4}
                  style={{ width: "100%" }}
                  placeholder="Write or paste your own bullet..."
                  value={customBullet}
                  onChange={(e) => setCustomBullet(e.target.value)}
                />
              )}
            </div>
          )}

          {/* STEP 3 */}
          {selectedTrace && (
            <div style={{ marginTop: 20 }}>
              <button onClick={handleFix}>
                🔧 Improve bullet
              </button>
            </div>
          )}

          {/* EXPERIENCE */}
          <h3 style={{ marginTop: 30 }}>Experience</h3>
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
