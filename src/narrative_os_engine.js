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
  const requirements = jdStruct?.must_have || []
  if (!requirements.length) return { weights: [], reasons: [] }

  const chunks = resume.split("\n").filter(Boolean)

  const resumeEmb = (await getEmbeddingsBatch(chunks)).filter(Boolean)
  const reqEmb = await getEmbeddingsBatch(requirements)

  const weights = []
  const reasons = []

  for (let i = 0; i < requirements.length; i++) {
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

// --- GENERATE SIMPLE SECTION ---
async function genSection(title, instruction, base, jdStruct, callClaude) {
  return await callClaude(
    `Write ONLY the ${title} section. Be concise. Do not invent experience.`,
    `Resume:
${base.slice(0, 1200)}

Requirements:
${(jdStruct?.must_have || []).join("\n")}

${instruction}`
  )
}

// --- GENERATE SINGLE ROLE ---
async function genRole(roleIndex, base, jdStruct, callClaude) {
  return await callClaude(
    "Extract and rewrite ONE role from the resume. Do not invent content.",
    `Resume:
${base}

Task:
- Select the ${roleIndex} most recent role
- Rewrite it with:
  - Title
  - Company
  - Dates
  - MAX 4 bullets
- Keep concise
- Do NOT include other roles`
  )
}

// --- MAIN ---
export async function generateResume(base, jd, stories, jdStruct, callClaude) {

  console.log("🚀 NEW ENGINE RUNNING")

  const summary = await genSection(
    "Executive Summary",
    "3–4 lines max. Focus on leadership + scope.",
    base,
    jdStruct,
    callClaude
  )

  const skills = await genSection(
    "Core Competencies",
    "8–10 bullets max. Use existing skills only.",
    base,
    jdStruct,
    callClaude
  )

  // 🔥 FIX: PER-ROLE GENERATION
  const role1 = await genRole(1, base, jdStruct, callClaude)
  const role2 = await genRole(2, base, jdStruct, callClaude)
  const role3 = await genRole(3, base, jdStruct, callClaude)

  const experience = `
${role1}

${role2}

${role3}
`

  const edu = await genSection(
    "Education and Certifications",
    "Include education + certs if present. Keep short.",
    base,
    jdStruct,
    callClaude
  )

  const finalResume = `
${base.split("\n")[0]}

${summary}

${skills}

PROFESSIONAL EXPERIENCE
${experience}

${edu}
`

  // --- VALIDATE ---
  const truth = await validate(base, jdStruct)
  const gen = await validate(finalResume, jdStruct)

  const total = gen.weights.length || 1
  const genScore = gen.weights.reduce((a, b) => a + b, 0)
  const truthScore = truth.weights.reduce((a, b) => a + b, 0)

  let adjusted = (genScore * 0.7) + (truthScore * 0.3)

  const critical = jdStruct?.must_have?.slice(0, 2) || []
  critical.forEach((_, i) => {
    if ((truth.weights[i] || 0) === 0) adjusted -= 0.3
  })

  adjusted = Math.max(adjusted, 0.2)

  const coverage = adjusted / total
  const score = Math.round(coverage * 10)

  return {
    best: finalResume,
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
