exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}")
    const system = body.system || ""
    const user = body.user || ""

    if (!system || !user) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          error: "Missing system or user input"
        })
      }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000) // 🔥 slightly longer

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        max_tokens: 800, // 🔥 FIXED (was 300)
        temperature: 0.2
      })
    })

    clearTimeout(timeout)

    const data = await response.json()

    const text =
      data?.choices?.[0]?.message?.content ||
      "No response from OpenAI"

    return {
      statusCode: 200,
      body: JSON.stringify({ text })
    }

  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        text: "LLM timeout or error",
        error: e.message
      })
    }
  }
}
