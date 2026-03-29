exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || "{}")
    const input = body.input

    if (!input) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: "Missing input" })
      }
    }

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input
      })
    })

    const data = await response.json()

    if (data?.error) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: data.error.message })
      }
    }

    const embedding = data?.data?.[0]?.embedding

    return {
      statusCode: 200,
      body: JSON.stringify({ embedding })
    }

  } catch (e) {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: e.message })
    }
  }
}
