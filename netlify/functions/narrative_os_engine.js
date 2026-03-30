// narrative_os_engine.js

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

function clean(text = "") {
  return text.replace(/^com\s+/i, "").trim();
}

function extractBullets(text = "") {
  try {
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

  } catch {
    return [];
  }
}

function extractRequirements(text = "") {
  try {
    return text
      .split("\n")
      .map(r => clean(r))
      .filter(r => r.length > 25)
      .slice(0, 20);
  } catch {
    return [];
  }
}

function scoreBullet(req, bullet) {
  try {
    const r = req.toLowerCase();
    const b = bullet.toLowerCase();

    let score = 0;

    if (b.includes("program")) score += 0.3;
    if (b.includes("stakeholder")) score += 0.2;
    if (b.includes("deliver")) score += 0.3;

    if (r.split(" ").some(w => b.includes(w))) {
      score += 0.2;
    }

    return Math.min(score, 1);

  } catch {
    return 0;
  }
}

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

    const coverage =
      results.filter(r => r?.rankedBullets?.[0]?.score > 0.3).length /
      (results.length || 1);

    return {
      score: Math.round(coverage * 10),
      coverage,
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
