// --- SAFE FETCH ---
async function safeJsonFetch(url, body) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const text = await res.text()

    try {
      return JSON.parse(text)
    } catch {
      console.error("Non-JSON response:", text)
      return {}
    }
  } catch (e) {
    console.error("Fetch error:", e)
    return {}
  }
}

// --- BATCH EMBEDDINGS ---
async function getEmbeddingsBatch(texts) {
  const data = await safeJsonFetch("/.netlify/functions/embeddings", {
    input: texts
  })

  return data?.embeddings || []
}

// --- COSINE ---
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0

  let dot = 0, magA = 0, magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }

  if (!magA || !magB) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

// --- JD PARSING ---
export async function parseJD(jd, callClaude) {
  try {
    const res = await callClaude(
      "Extract must-have requirements as JSON: { must_have: [] }",
      jd
    )
    const match = res.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { must_have: [] }
  } catch {
    return { must_have: [] }
  }
}

// --- FAST EMBEDDING VALIDATION ---
async function validateEmbeddingOnly(resume, jdStruct) {
  const requirements = jdStruct?.must_have || []
  if (!requirements.length) return { reasons: [], weights: [] }

  const resumeChunks = resume.split("\n").map(s => s.trim()).filter(Boolean)

  const resumeEmbeddings = (await getEmbeddingsBatch(resumeChunks)).filter(Boolean)
  const reqEmbeddings = await getEmbeddingsBatch(requirements)

  const reasons = []
  const weights = []

  for (let i = 0; i < requirements.length; i++) {
    const reqEmb = reqEmbeddings[i]

    let bestScore = 0

    if (reqEmb && resumeEmbeddings.length) {
      for (const emb of resumeEmbeddings) {
        const s = cosineSimilarity(emb, reqEmb)
        if (s > bestScore) bestScore = s
      }
    }

    // 🔥 FIXED THRESHOLDS
    if (bestScore > 0.78) {
      reasons.push("Strong")
      weights.push(1)
    } else if (bestScore > 0.60) {
      reasons.push("Weak")
      weights.push(0.5)
    } else {
      reasons.push("None")
      weights.push(0)
    }
  }

  return { reasons, weights }
}

// --- GENERATION (FAST MODE) ---
export async function generateResume(base, jd, stories, jdStruct, callClaude) {
  const res = await callClaude(
    "Rewrite resume optimized for ATS. DO NOT invent experience.",
    `Original Resume:
${base}

Job Description:
${jd}

Only improve wording and alignment.`
  )

  const truth = await validateEmbeddingOnly(base, jdStruct)
  const gen = await validateEmbeddingOnly(res, jdStruct)

  const total = gen.weights.length || 1

  const genScore = gen.weights.reduce((a, b) => a + b, 0)
  const truthScore = truth.weights.reduce((a, b) => a + b, 0)

  let adjusted = (genScore * 0.7) + (truthScore * 0.3)

  // 🔥 MUST-HAVE PENALTY
  const critical = jdStruct?.must_have?.slice(0, 2) || []
  critical.forEach((_, idx) => {
    if ((truth.weights[idx] || 0) === 0) {
      adjusted -= 0.5
    }
  })

  const coverage = adjusted / total
  const score = Math.max(0, Math.round(coverage * 10))

  return {
    best: res,
    bestScore: score,
    keywords: jdStruct?.must_have || [],
    jdStruct,
    explain: {
      coverage,
      semanticReasons: gen.reasons
    },
    reject: score < 5
  }
}
