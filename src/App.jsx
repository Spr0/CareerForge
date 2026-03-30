import { useState } from "react";

export default function App() {
  const [resumeInput, setResumeInput] = useState("");
  const [jdInput, setJdInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  function extractRequirements(text) {
    return text
      .split(/[\n•\-]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 20)
      .slice(0, 15);
  }

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/.netlify/functions/generate", {
        method: "POST",
        body: JSON.stringify({
          resume: resumeInput,
          requirements: extractRequirements(jdInput)
        })
      });

      const data = await response.json();
      console.log("RESPONSE:", data);

      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>NarrativeOS</h1>

      <h3>Resume</h3>
      <textarea
        rows={10}
        style={{ width: "100%" }}
        value={resumeInput}
        onChange={(e) => setResumeInput(e.target.value)}
      />

      <h3>Job Description</h3>
      <textarea
        rows={6}
        style={{ width: "100%" }}
        value={jdInput}
        onChange={(e) => setJdInput(e.target.value)}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {result && !result.error && (
        <div style={{ marginTop: 20 }}>
          <h2>{result.header}</h2>
          <p>{result.summary}</p>

          <h3>Skills</h3>
          <ul>
            {result.skills?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h3>Experience</h3>
          {result.roles?.length > 0 ? (
            result.roles.map((r, i) => (
              <div key={i}>
                <strong>
                  {r.title} — {r.company}
                </strong>
                <ul>
                  {r.bullets?.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p>No roles parsed</p>
          )}

          <h3>Education</h3>

          {Array.isArray(result.education) ? (
            <ul>
              {result.education.map((edu, i) => (
                <li key={i}>
                  {edu.degree || ""}{" "}
                  {edu.field ? `in ${edu.field}` : ""} —{" "}
                  {edu.institution || ""}
                </li>
              ))}
            </ul>
          ) : (
            <p>{result.education}</p>
          )}
        </div>
      )}

      {result?.error && (
        <div style={{ color: "red", marginTop: 20 }}>
          Error: {result.message}
        </div>
      )}
    </div>
  );
}
