exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}")
    const system = body.system || ""
    const user = body.user || ""

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000) // 🔥 12s max

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // 🔥 FAST model
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        max_tokens: 500,       // 🔥 LIMIT OUTPUT
        temperature: 0.3       // 🔥 MORE DETERMINISTIC
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
