// NarrativeOS — Stable Baseline Engine (No LLM, Clean Parsing)

function cleanLine(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function isNoise(line = "") {
  const l = line.toLowerCase();

  return (
    // contact / links
    l.includes("@") ||
    l.includes("http") ||
    l.includes("linkedin") ||

    // recruiter-style fluff (generic, not hardcoded names)
    l.includes("i came across") ||
    l.includes("please send") ||
    l.includes("forward your resume") ||
    l.includes("immediate consideration") ||
    l.includes("job boards") ||

    // too short
    l.length < 40
  );
}

// ─────────────────────────────────────────
// REQUIREMENTS (JOB DESCRIPTION)
// ─────────────────────────────────────────

function extractRequirements(text = "") {
  try {
    return text
      .split(/\n|\./)
      .map(cleanLine)
      .filter(l => !isNoise(l))
      .slice(0, 10);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────
// RESUME BULLETS
// ─────────────────────────────────────────

function extractBullets(text = "") {
  try {
    return text
      .split("\n")
      .map(cleanLine)
      .filter(l => !isNoise(l))
      .slice(0, 25);
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────
// MATCHING (SIMPLE + HONEST)
// ─────────────────────────────────────────

function score(req, bullet) {
  try {
    const r = req.toLowerCase();
    const b = bullet.toLowerCase();

    let s = 0;

    // high-signal keywords
    if (b.includes("erp")) s += 0.25;
    if (b.includes("program")) s += 0.2;
    if (b.includes("delivery")) s += 0.2;
    if (b.includes("stakeholder")) s += 0.15;
    if (b.includes("transformation")) s += 0.15;

    // overlap
    const words = r.split(/\W+/).filter(w => w.length > 5);
    let overlap = 0;

    words.forEach(w => {
      if (b.includes(w)) overlap++;
    });

    s += Math.min(overlap * 0.05, 0.25);

    return Math.min(1, s);

  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────
// SUMMARY (UX FIX)
// ─────────────────────────────────────────

function summarize(text = "") {
  if (!text) return "";

  let s = text.split(";")[0];

  if (s.length > 140) {
    s = s.slice(0, 140) + "...";
  }

  return s;
}

// ─────────────────────────────────────────
// MAIN ENGINE
// ─────────────────────────────────────────

export async function analyzeJob(jobText = "", resumeText = "") {
  try {
    const requirements = extractRequirements(jobText);
    const bullets = extractBullets(resumeText);

    const results = [];

    for (const req of requirements) {
      let bestScore = 0;
      let bestBullet = "";

      for (const b of bullets) {
        const s = score(req, b);

        if (s > bestScore) {
          bestScore = s;
          bestBullet = b;
        }
      }

      const strength = Math.round(bestScore * 100);

      results.push({
        requirement: req,
        score: strength,
        summary: summarize(bestBullet),
        gap: bestScore < 0.45
          ? "Not clearly demonstrated"
          : null,
        fix: bestScore < 0.45
          ? "Add measurable outcomes, scope, or stakeholder impact"
          : null
      });
    }

    const avg =
      results.reduce((a, r) => a + r.score, 0) /
      (results.length || 1);

    return {
      score: Math.round(avg / 10),
      requirements: results
    };

  } catch (e) {
    console.error("ENGINE ERROR:", e);

    return {
      score: 0,
      requirements: [],
      error: true
    };
  }
}
