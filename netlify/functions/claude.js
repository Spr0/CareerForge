exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}")
    const system = body.system
    const user = body.user

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku",
        max_tokens: 1000,
        system: system,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: user }
            ]
          }
        ]
      })
    })

    const data = await response.json()

    // Return raw for now (debug mode)
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    }

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: e.message || "Claude error"
      })
    }
  }
}
