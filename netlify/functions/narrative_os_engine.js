// narrative_os_engine.js

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function clean(text = "") {
  return text.replace(/^com\s+/i, "").trim();
}

// ==============================
// REQUIREMENTS
// ==============================

function extractRequirements(text = "") {
  return text
    .split("\n")
    .map(r => clean(r))
    .filter(r =>
      r.length > 30 &&
      !/responsibilities$/i.test(r)
    )
    .slice(0, 12);
}

// ==============================
// BULLETS
// ==============================

function extractBullets(text = "") {
  const lines = text.split("\n").map(l => clean(l)).filter(Boolean);

  let bullets = lines.filter(l =>
    l.startsWith("-") ||
    l.startsWith("•") ||
    l.startsWith("*")
  );

  bullets = bullets.map(b => b.replace(/^[-•*]\s*/, ""));

  if (bullets.length === 0) {
    bullets = text
      .split(/[.!?]/)
      .map(s => clean(s))
      .filter(s => s.length > 40);
  }

  return safeArray(bullets).slice(0, 20);
}

// ==============================
// GENERIC PENALTY
// ==============================

function genericPenalty(text = "") {
  const t = text.toLowerCase();

  let penalty = 0;

  if (t.includes("responsible for")) penalty += 0.15;
  if (t.includes("led")) penalty += 0.05;
  if (t.includes("managed")) penalty += 0.05;

  if (
    t.includes("program") &&
    t.includes("delivery") &&
    !t.match(/\d/)
  ) {
    penalty += 0.2; // generic leadership fluff
  }

  return penalty;
}

// ==============================
// SCORING (FIXED DISTRIBUTION)
// ==============================

function scoreBullet(req, bullet) {
  const r = req.toLowerCase();
  const b = bullet.toLowerCase();

  let score = 0;

  let signalCount = 0;

  // capability signals (lower weights)
  if (b.includes("program")) {
    score += 0.15;
    signalCount++;
  }

  if (b.includes("delivery")) {
    score += 0.15;
    signalCount++;
  }

  if (b.includes("stakeholder")) {
    score += 0.1;
    signalCount++;
  }

  if (b.includes("dependency")) {
    score += 0.1;
    signalCount++;
  }

  // keyword overlap (reduced)
  const words = r.split(/\W+/).filter(w => w.length > 6);
  const matches = words.filter(w => b.includes(w)).length;

  score += Math.min(matches * 0.05, 0.2);

  // require multiple signals for high score
  if (signalCount >= 3) {
    score += 0.15;
  }

  // penalty
  score -= genericPenalty(b);

  // clamp
  return Math.max(0, Math.min(score, 1));
}

// ==============================
// MAIN ENGINE
// ==============================

export async function runNarrativeOS({
  resumeText = "",
  jobDescription = ""
}) {
  try {
    const requirements = extractRequirements(jobDescription);
    const bullets = extractBullets(resumeText);

    const results = [];

    for (const req of requirements) {
      const ranked = safeArray(bullets).map((b, i) => ({
        bulletId: i,
        text: b,
        score: scoreBullet(req, b),
      }));

      ranked.sort((a, b) => b.score - a.score);

      results.push({
        requirement: req,
        capability: "GENERAL",
        rankedBullets: ranked.slice(0, 5),
        recommendation: ranked[0] || null,
      });
    }

    // ==============================
    // REALISTIC SCORING
    // ==============================

    const strong = results.filter(
      r => r?.rankedBullets?.[0]?.score >= 0.75
    ).length;

    const medium = results.filter(
      r => {
        const s = r?.rankedBullets?.[0]?.score || 0;
        return s >= 0.55 && s < 0.75;
      }
    ).length;

    const total = results.length || 1;

    const weighted =
      (strong * 1.0 + medium * 0.5) / total;

    const compressed = Math.pow(weighted, 1.2);

    const finalScore = Math.min(
      10,
      Math.round(compressed * 10)
    );

    return {
      score: finalScore,
      coverage: weighted,
      requirements: safeArray(results),
    };

  } catch (e) {
    console.error("ENGINE FAIL:", e);

    return {
      score: 0,
      coverage: 0,
      requirements: [],
    };
  }
}
