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
    signals: ["program", "delivery", "roadmap", "execution"],
    guidance: "Clarify ownership of delivery, scope, and measurable outcomes."
  },
  {
    name: "DEPENDENCY_MANAGEMENT",
    signals: ["dependency", "dependencies", "blockers"],
    guidance: "Show how dependencies were identified, managed, and resolved."
  },
  {
    name: "STAKEHOLDER_MANAGEMENT",
    signals: ["stakeholder", "executive", "alignment"],
    guidance: "Highlight stakeholder groups, influence, and alignment outcomes."
  },
  {
    name: "PROCESS_OPTIMIZATION",
    signals: ["optimize", "improve", "efficiency", "process"],
    guidance: "Quantify improvements and describe what changed and why."
  }
];

// ==============================
// UTIL
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

function isGenericBullet(text) {
  const lower = text.toLowerCase();
  return GENERIC_PHRASES.some(p => lower.includes(p));
}

// ==============================
// CAPABILITY EXTRACTION
// ==============================

function extractCapabilities(text) {
  const lower = text.toLowerCase();

  const caps = CAPABILITY_RULES.map(rule => {
    const matches = rule.signals.filter(s => lower.includes(s));
    return {
      name: rule.name,
      score: matches.length / rule.signals.length,
      guidance: rule.guidance
    };
  }).filter(c => c.score > 0);

  // sort strongest first
  caps.sort((a, b) => b.score - a.score);

  return caps;
}

// ==============================
// KEYWORD SCORE
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

    if (cap.name === "PROCESS_OPTIMIZATION" && text.includes("improv")) {
      score += 0.3;
    }
  }

  return Math.min(score, 1);
}

// ==============================
// GAP ANALYSIS (NEW)
// ==============================

function analyzeGaps(reqCaps, bullet) {
  const text = bullet.toLowerCase();

  const missing = [];

  for (const cap of reqCaps) {
    if (cap.name === "DEPENDENCY_MANAGEMENT" && !text.includes("depend")) {
      missing.push("dependency management");
    }

    if (cap.name === "STAKEHOLDER_MANAGEMENT" && !text.includes("stakeholder")) {
      missing.push("stakeholder scope");
    }

    if (cap.name === "PROGRAM_DELIVERY" && !text.includes("program")) {
      missing.push("program ownership");
    }

    if (cap.name === "PROCESS_OPTIMIZATION" && !text.includes("improv")) {
      missing.push("quantified improvements");
    }
  }

  return missing;
}

// ==============================
// SCORE DELTA ESTIMATION (NEW)
// ==============================

function estimateScoreDelta(missing) {
  let delta = 0;

  for (const gap of missing) {
    if (gap.includes("dependency")) delta += 0.15;
    if (gap.includes("stakeholder")) delta += 0.1;
    if (gap.includes("program")) delta += 0.1;
    if (gap.includes("improvement")) delta += 0.1;
  }

  return Math.min(delta, 0.5);
}

// ==============================
// REWRITE GUIDANCE (NEW)
// ==============================

function buildRewriteGuidance(requirement, bullet, missing, capability) {
  return {
    instruction: `Rewrite this bullet to better align with the requirement.`,
    requirement,
    currentBullet: bullet,
    improveBy: missing,
    guidance: capability?.guidance || "Improve specificity and alignment.",
    exampleFocus: `Ensure the bullet explicitly demonstrates: ${missing.join(", ")}`
  };
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
  // INPUT PARSING
  // ------------------------------

  const requirements = jobDescription
    .split("\n")
    .filter(r => r.trim().length > 20);

  const bullets = resumeText
    .split("\n")
    .filter(b => b.trim().startsWith("-"));

  // ------------------------------
  // EMBEDDINGS
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
  // SCORING
  // ------------------------------

  const bulletUsage = {};
  const results = [];

  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];
    const reqEmbedding = reqEmbeddings[i];

    const reqCaps = extractCapabilities(req);
    const primaryCap = reqCaps[0];

    const ranked = [];

    for (let j = 0; j < bullets.length; j++) {
      const bullet = bullets[j];
      const bulletEmbedding = bulletEmbeddings[j];

      const embScore = cosineSimilarity(reqEmbedding, bulletEmbedding);
      const capScore = capabilityScore(reqCaps, bullet);
      const keyScore = keywordScore(req, bullet);

      let penalty = 0;

      if (bulletUsage[j]) {
        penalty += 0.15 * bulletUsage[j];
      }

      if (isGenericBullet(bullet)) {
        penalty += 0.2;
      }

      const finalScore =
        (0.5 * embScore) +
        (0.3 * capScore) +
        (0.2 * keyScore) -
        penalty;

      const missing = analyzeGaps(reqCaps, bullet);
      const delta = estimateScoreDelta(missing);

      ranked.push({
        bulletId: j,
        text: bullet,
        score: finalScore,
        breakdown: {
          embedding: embScore,
          capability: capScore,
          keyword: keyScore,
          penalty: penalty
        },
        gaps: missing,
        estimatedImprovement: delta
      });
    }

    ranked.sort((a, b) => b.score - a.score);

    const best = ranked[0];
    bulletUsage[best.bulletId] =
      (bulletUsage[best.bulletId] || 0) + 1;

    const rewriteGuidance = buildRewriteGuidance(
      req,
      best.text,
      best.gaps,
      primaryCap
    );

    results.push({
      requirement: req,
      capability: primaryCap?.name || "GENERAL",
      bestBulletId: best.bulletId,
      rankedBullets: ranked.slice(0, 5),
      recommendation: {
        bestBullet: best.text,
        gaps: best.gaps,
        estimatedScoreIncrease: best.estimatedImprovement,
        rewriteGuidance
      }
    });
  }

  // ------------------------------
  // FINAL SCORE
  // ------------------------------

  let covered = 0;

  for (const r of results) {
    if (r.rankedBullets[0].score > 0.5) {
      covered++;
    }
  }

  const coverage = covered / requirements.length;
  const score = Math.round(coverage * 10);

  return {
    score,
    coverage,
    requirements: results
  };
}
