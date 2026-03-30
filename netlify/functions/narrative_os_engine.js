// narrative_os_engine.js

// ==============================
// CONFIG
// ==============================

const GENERIC_PHRASES = [
  "program governance",
  "stakeholders",
  "cross-functional",
  "delivery excellence",
  "strategic alignment"
];

const CAPABILITY_RULES = [
  {
    name: "PROGRAM_DELIVERY",
    signals: ["program", "delivery", "roadmap", "execution"]
  },
  {
    name: "DEPENDENCY_MANAGEMENT",
    signals: ["dependency", "dependencies", "blockers"]
  },
  {
    name: "STAKEHOLDER_MANAGEMENT",
    signals: ["stakeholder", "executive", "alignment"]
  },
  {
    name: "PROCESS_OPTIMIZATION",
    signals: ["optimize", "improve", "efficiency", "process"]
  }
];

// ==============================
// UTIL: COSINE SIMILARITY
// ==============================

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ==============================
// UTIL: GENERIC DETECTION
// ==============================

function isGenericBullet(text) {
  const lower = text.toLowerCase();
  return GENERIC_PHRASES.some(p => lower.includes(p));
}

// ==============================
// CAPABILITY EXTRACTION
// ==============================

function extractCapabilities(text) {
  const lower = text.toLowerCase();

  return CAPABILITY_RULES.map(rule => {
    const matches = rule.signals.filter(s => lower.includes(s));
    return {
      name: rule.name,
      score: matches.length / rule.signals.length
    };
  }).filter(c => c.score > 0);
}

// ==============================
// KEYWORD SCORE (lightweight)
// ==============================

function keywordScore(req, bullet) {
  const reqWords = req.toLowerCase().split(/\W+/);
  const bulletWords = bullet.toLowerCase();

  let matches = 0;

  for (const w of reqWords) {
    if (w.length > 4 && bulletWords.includes(w)) {
      matches++;
    }
  }

  return Math.min(matches / 5, 1);
}

// ==============================
// CAPABILITY SCORE
// ==============================

function capabilityScore(reqCaps, bullet) {
  const text = bullet.toLowerCase();

  let score = 0;

  for (const cap of reqCaps) {
    if (cap.name === "DEPENDENCY_MANAGEMENT" && text.includes("depend")) {
      score += 0.4;
    }

    if (cap.name === "STAKEHOLDER_MANAGEMENT" && text.includes("stakeholder")) {
      score += 0.3;
    }

    if (cap.name === "PROGRAM_DELIVERY" && text.includes("program")) {
      score += 0.3;
    }
  }

  return Math.min(score, 1);
}

// ==============================
// MAIN ENGINE
// ==============================

export async function runNarrativeOS({
  resumeText,
  jobDescription,
  openai
}) {
  // ------------------------------
  // STEP 1: SPLIT INPUTS
  // ------------------------------

  const requirements = jobDescription
    .split("\n")
    .filter(r => r.trim().length > 20);

  const bullets = resumeText
    .split("\n")
    .filter(b => b.trim().startsWith("-"));

  // ------------------------------
  // STEP 2: EMBEDDINGS (with cache)
  // ------------------------------

  const cache = new Map();

  async function getEmbedding(text) {
    if (cache.has(text)) return cache.get(text);

    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const emb = res.data[0].embedding;
    cache.set(text, emb);
    return emb;
  }

  const reqEmbeddings = [];
  for (const r of requirements) {
    reqEmbeddings.push(await getEmbedding(r));
  }

  const bulletEmbeddings = [];
  for (const b of bullets) {
    bulletEmbeddings.push(await getEmbedding(b));
  }

  // ------------------------------
  // STEP 3: SCORING
  // ------------------------------

  const bulletUsage = {};

  const results = [];

  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    const reqEmbedding = reqEmbeddings[i];

    const reqCaps = extractCapabilities(req);

    const ranked = [];

    for (let j = 0; j < bullets.length; j++) {
      const bullet = bullets[j];
      const bulletEmbedding = bulletEmbeddings[j];

      // --- embedding ---
      const embScore = cosineSimilarity(reqEmbedding, bulletEmbedding);

      // --- capability ---
      const capScore = capabilityScore(reqCaps, bullet);

      // --- keyword ---
      const keyScore = keywordScore(req, bullet);

      // --- penalties ---
      let penalty = 0;

      if (bulletUsage[j]) {
        penalty += 0.15 * bulletUsage[j];
      }

      if (isGenericBullet(bullet)) {
        penalty += 0.2;
      }

      // --- final ---
      const finalScore =
        (0.5 * embScore) +
        (0.3 * capScore) +
        (0.2 * keyScore) -
        penalty;

      ranked.push({
        bulletId: j,
        text: bullet,
        score: finalScore,
        breakdown: {
          embedding: embScore,
          capability: capScore,
          keyword: keyScore,
          penalty: penalty
        }
      });
    }

    // sort
    ranked.sort((a, b) => b.score - a.score);

    // mark usage
    const best = ranked[0];
    bulletUsage[best.bulletId] =
      (bulletUsage[best.bulletId] || 0) + 1;

    results.push({
      requirement: req,
      bestBulletId: best.bulletId,
      rankedBullets: ranked.slice(0, 5)
    });
  }

  // ------------------------------
  // STEP 4: SCORING SUMMARY
  // ------------------------------

  let covered = 0;

  for (const r of results) {
    if (r.rankedBullets[0].score > 0.5) {
      covered++;
    }
  }

  const coverage = covered / requirements.length;

  const score = Math.round(coverage * 10);

  // ------------------------------
  // FINAL OUTPUT
  // ------------------------------

  return {
    score,
    coverage,
    requirements: results
  };
}
