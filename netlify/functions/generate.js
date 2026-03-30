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
    } catch (e) {
      return {
        statusCode: 200,
        body: JSON.stringify(
          safeResponse({ error: true, message: "Invalid JSON" })
        ),
      };
    }

    let result;

    try {
      result = await runNarrativeOS({
        resumeText: body.resumeText || "",
        jobDescription: body.jobDescription || "",
      });
    } catch (engineError) {
      console.error("ENGINE CRASH:", engineError);

      return {
        statusCode: 200,
        body: JSON.stringify(
          safeResponse({
            error: true,
            message: "Engine failed safely",
          })
        ),
      };
    }

    if (!result || typeof result !== "object") {
      return {
        statusCode: 200,
        body: JSON.stringify(
          safeResponse({
            error: true,
            message: "Invalid engine output",
          })
        ),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(safeResponse(result)),
    };

  } catch (fatal) {
    console.error("FATAL ERROR:", fatal);

    return {
      statusCode: 200,
      body: JSON.stringify(
        safeResponse({
          error: true,
          message: "Unexpected failure",
        })
      ),
    };
  }
}
