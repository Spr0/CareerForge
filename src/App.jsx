import { useState } from "react";

export default function App() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    score: 0,
    coverage: 0,
    requirements: [],
    error: false,
    message: "",
  });

  const handleAnalyze = async () => {
    setLoading(true);

    try {
      const res = await fetch("/.netlify/functions/generate", {
        method: "POST",
        body: JSON.stringify({ resumeText, jobDescription }),
      });

      const result = await res.json();

      setData({
        score: result?.score ?? 0,
        coverage: result?.coverage ?? 0,
        requirements: Array.isArray(result?.requirements)
          ? result.requirements
          : [],
        error: result?.error ?? false,
        message: result?.message ?? "",
      });
    } catch (err) {
      console.error(err);
      setData({
        score: 0,
        coverage: 0,
        requirements: [],
        error: true,
        message: "Request failed",
      });
    }

    setLoading(false);
  };

  const safeRequirements = Array.isArray(data.requirements)
    ? data.requirements
    : [];

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>NarrativeOS</h1>

      <textarea
        placeholder="Paste Resume"
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        rows={8}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <textarea
        placeholder="Paste Job Description"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        rows={8}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {data.error && (
        <div style={{ color: "red", marginTop: 20 }}>
          {data.message || "Something went wrong"}
        </div>
      )}

      {!data.error && (
        <div style={{ marginTop: 20 }}>
          <h2>Score: {data.score}/10</h2>
          <p>Coverage: {(data.coverage * 100).toFixed(0)}%</p>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        {safeRequirements.map((req, i) => {
          const ranked = Array.isArray(req?.rankedBullets)
            ? req.rankedBullets
            : [];

          const best = ranked[0];

          return (
            <div
              key={i}
              style={{
                border: "1px solid #ccc",
                padding: 15,
                marginBottom: 15,
              }}
            >
              <h3>Requirement</h3>
              <p>{req.requirement}</p>

              <p>
                <strong>Capability:</strong>{" "}
                {req.capability || "GENERAL"}
              </p>

              {best && (
                <div style={{ background: "#f3f3f3", padding: 10 }}>
                  <strong>⭐ Best Match</strong>
                  <p>{best.text}</p>
                  <p>Score: {best.score.toFixed(2)}</p>
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <strong>Top Matches</strong>

                {ranked.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderTop: "1px solid #eee",
                      marginTop: 8,
                      paddingTop: 8,
                    }}
                  >
                    <p>{b.text}</p>

                    <small>
                      Score: {b.score.toFixed(2)} | Emb:{" "}
                      {b.breakdown?.embedding?.toFixed(2)} | Cap:{" "}
                      {b.breakdown?.capability?.toFixed(2)}
                    </small>

                    {b.gaps?.length > 0 && (
                      <div>
                        <small>
                          Missing: {b.gaps.join(", ")}
                        </small>
                      </div>
                    )}

                    {b.estimatedImprovement > 0 && (
                      <div>
                        <small>
                          Potential Gain: +
                          {b.estimatedImprovement.toFixed(2)}
                        </small>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {req?.recommendation?.rewriteGuidance && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    background: "#eef6ff",
                  }}
                >
                  <strong>Rewrite Guidance</strong>
                  <p>
                    {req.recommendation.rewriteGuidance.guidance}
                  </p>
                  <p>
                    {
                      req.recommendation.rewriteGuidance
                        .exampleFocus
                    }
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
