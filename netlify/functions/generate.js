import { runNarrativeOS } from "./narrative_os_engine.js";

function safeResponse(data = {}) {
  return {
    score: 0,
    coverage: 0,
    requirements: [],
    error: false,
    message: "",
    ...data,
  };
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 200,
        body: JSON.stringify(
          safeResponse({ error: true, message: "POST only" })
        ),
      };
    }

    let body = {};

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 200,
        body: JSON.stringify(
          safeResponse({ error: true, message: "Invalid JSON" })
        ),
      };
    }

    const result = await runNarrativeOS({
      resumeText: body.resumeText || "",
      jobDescription: body.jobDescription || "",
    });

    return {
      statusCode: 200,
      body: JSON.stringify(safeResponse(result)),
    };

  } catch (err) {
    console.error("FATAL:", err);

    return {
      statusCode: 200,
      body: JSON.stringify(
        safeResponse({
          error: true,
          message: "Server failure",
        })
      ),
    };
  }
}
