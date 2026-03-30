import { useState } from "react";
import * as Engine from "./narrative_os_engine.js";

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

export default function App() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log("Running analysis...");

      const data = await Engine.analyzeJob(jd, resume);

      console.log("RESULT:", data);

      setResult(data);

    } catch (e) {
      console.error("Analyze failed:", e);

      setResult({
        error: true,
        message: e.message || "Unknown error"
      });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>NarrativeOS</h1>

      <textarea
        placeholder="Job Description"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        style={{ width: "100%", height: 120 }}
      />

      <textarea
        placeholder="Resume"
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        style={{ width: "100%", height: 120, marginTop: 10 }}
      />

      <button onClick={analyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {/* ERROR */}
      {result?.error && (
        <div style={{ color: "red", marginTop: 10 }}>
          Error: {result.message || "Something went wrong"}
        </div>
      )}

      {/* SCORE */}
      {result?.score !== undefined && (
        <h2>Score: {result.score}/10</h2>
      )}

      {/* RESULTS */}
      {safeArray(result?.requirements).map((r, i) => (
        <div key={i} style={{ border: "1px solid #ccc", marginTop: 10, padding: 10 }}>
          <strong>{r.requirement}</strong>
          <div>Strength: {r.score}</div>
          <div>{r.summary}</div>

          {r.gap && <div style={{ color: "red" }}>Gap: {r.gap}</div>}
          {r.fix && <div style={{ color: "green" }}>Fix: {r.fix}</div>}
        </div>
      ))}
    </div>
  );
}
