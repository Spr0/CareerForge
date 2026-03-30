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
  if (!texts?.length) return []

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

// --- CLEAN BULLETS (HARD LIMIT) ---
function limitBullets(text, max = 4) {
  if (!text) return ""

  const lines = text.split("\n")
  const bullets = lines.filter(l => l.trim().startsWith("-"))

  const trimmed = bullets.slice(0, max)

  return lines
    .filter(l => !l.trim().startsWith("-"))
    .concat(trimmed)
    .join("\n")
}

// --- PARSE JD ---
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

// --- VALIDATE ---
async function validate(resume, jdStruct) {
  const reqs = jdStruct?.must_have || []
  if (!reqs.length) return { weights: [], reasons: [] }

  const chunks = resume.split("\n").filter(Boolean)
  const resumeEmb = (await getEmbeddingsBatch(chunks)).filter(Boolean)
  const reqEmb = await getEmbeddingsBatch(reqs)

  const weights = []
  const reasons = []

  for (let i = 0; i < reqs.length; i++) {
    let best = 0

    for (const r of resumeEmb) {
      const s = cosineSimilarity(r, reqEmb[i])
      if (s > best) best = s
    }

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

// --- GENERATE ROLE ---
async function genRole(index, base, callClaude) {
  const raw = await callClaude(
    "Extract ONE role. Max 4 bullets. Do not invent.",
    `Resume:
${base}

Return ONLY the ${index} most recent role.`
  )

  return limitBullets(raw, 4)
}

// --- GENERATE SECTION ---
async function genSection(title, instruction, base, callClaude) {
  return await callClaude(
    `Write ${title}. Keep concise.`,
    `Resume:
${base}

${instruction}`
  )
}

// --- MAIN ---
export async function generateResume(base, jd, stories, jdStruct, callClaude) {

  console.log("🚀 FINAL ENGINE")

  const summary = await genSection(
    "Executive Summary",
    "Max 4 lines",
    base,
    callClaude
  )

  const skills = await genSection(
    "Core Competencies",
    "Max 10 bullets",
    base,
    callClaude
  )

  const role1 = await genRole(1, base, callClaude)
  const role2 = await genRole(2, base, callClaude)
  const role3 = await genRole(3, base, callClaude)

  const edu = await genSection(
    "Education and Certifications",
    "Keep short",
    base,
    callClaude
  )

  // 🔥 HARD STRUCTURE (always present)
  const finalResume = `
${base.split("\n")[0]}

EXECUTIVE SUMMARY
${summary}

CORE COMPETENCIES
${skills}

PROFESSIONAL EXPERIENCE
${role1}

${role2}

${role3}

EDUCATION & CERTIFICATIONS
${edu}
`

  const truth = await validate(base, jdStruct)
  const gen = await validate(finalResume, jdStruct)

  const total = gen.weights.length || 1
  const score = Math.round(
    ((gen.weights.reduce((a, b) => a + b, 0) * 0.7 +
      truth.weights.reduce((a, b) => a + b, 0) * 0.3) / total) * 10
  )

  return {
    best: finalResume,
    bestScore: score,
    keywords: jdStruct?.must_have || [],
    jdStruct,
    explain: {
      coverage: score / 10,
      semanticReasons: gen.reasons
    },
    reject: score < 4
  }
}
