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
      return {}
    }
  } catch {
    return {}
  }
}

// --- EMBEDDINGS ---
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

// --- JD PARSE ---
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

// --- VALIDATION (EMBEDDING ONLY) ---
async function validate(resume, jdStruct) {
  const requirements = jdStruct?.must_have || []
  if (!requirements.length) return { weights: [], reasons: [] }

  const resumeChunks = resume
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean)

  const resumeEmb = (await getEmbeddingsBatch(resumeChunks)).filter(Boolean)
  const reqEmb = await getEmbeddingsBatch(requirements)

  const weights = []
  const reasons = []

  for (let i = 0; i < requirements.length; i++) {
    let best = 0

    for (const r of resumeEmb) {
      const s = cosineSimilarity(r, reqEmb[i])
      if (s > best) best = s
    }

    // 🔥 CALIBRATED THRESHOLDS
    if (best > 0.75) {
      weights.push(1)
      reasons.push("Strong")
    } else if (best > 0.55) {
      weights.push(0.6)
      reasons.push("Weak")
    } else if (best > 0.45) {
      weights.push(0.3)
      reasons.push("Loose")
    } else {
      weights.push(0)
      reasons.push("None")
    }
  }

  return { weights, reasons }
}

// --- GENERATION (STRICT + FAST) ---
export async function generateResume(base, jd, stories, jdStruct, callClaude) {
  const res = await callClaude(
    "You are a resume editor. NEVER add skills, tools, or experience that are not explicitly stated in the original resume.",
    `Original Resume:
${base.slice(0, 2000)}

Job Requirements:
${(jdStruct?.must_have || []).join("\n")}

Rules:
- Do NOT add new technologies (e.g., ServiceNow if not present)
- Do NOT imply experience that does not exist
- ONLY rephrase or reorganize existing content
- If a requirement is missing, leave it missing

Rewrite to improve alignment while remaining 100% truthful and concise.`
  )

  const truth = await validate(base, jdStruct)
  const gen = await validate(res, jdStruct)

  const total = gen.weights.length || 1

  const genScore = gen.weights.reduce((a, b) => a + b, 0)
  const truthScore = truth.weights.reduce((a, b) => a + b, 0)

  // ⚖️ BALANCED SCORING
  let adjusted = (genScore * 0.7) + (truthScore * 0.3)

  // 🔥 LIGHT MUST-HAVE PENALTY
  const critical = jdStruct?.must_have?.slice(0, 2) || []
  critical.forEach((_, i) => {
    if ((truth.weights[i] || 0) === 0) {
      adjusted -= 0.3
    }
  })

  // 🔥 FLOOR (prevents 0 collapse)
  adjusted = Math.max(adjusted, 0.2)

  const coverage = adjusted / total
  const score = Math.round(coverage * 10)

  return {
    best: res,
    bestScore: score,
    keywords: jdStruct?.must_have || [],
    jdStruct,
    explain: {
      coverage,
      semanticReasons: gen.reasons
    },
    reject: score < 4
  }
}
