export async function handler(event) {
  try {
    const { system, user } = JSON.parse(event.body || "{}")

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system,
        messages: [
          { role: "user", content: user }
        ]
      })
    })

    const data = await response.json()

   let text = "No response from Claude"

if (data?.content && Array.isArray(data.content)) {
  const block = data.content.find(c => c.type === "text")
  if (block?.text) {
    text = block.text
  }
}

// DEBUG (optional but useful)
if (!text || text === "No response from Claude") {
  console.log("Claude raw response:", JSON.stringify(data))
}
    return {
      statusCode: 200,
      body: JSON.stringify({ text })
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
