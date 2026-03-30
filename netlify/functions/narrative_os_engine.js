function normalizeText(text = "") {
  return text.toLowerCase();
}

/**
 * 🧠 MAIN ENTRY
 */
async function generateNarrativeOSResume({
  resumeData = "",
  jobRequirements = []
}) {
  const resume = parseResume(resumeData);

  const analysis = analyzeRequirementsWithTrace(
    resume,
    jobRequirements
  );

  return {
    header: resume.header,
    summary: resume.summary,
    skills: resume.skills,
    roles: resume.roles,
    education: resume.education,
    analysis
  };
}

/**
 * 🧱 PARSER (STABLE + DEFENSIVE)
 */
function parseResume(text) {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  return {
    header: lines[0] || "Candidate",
    summary: extractSummary(lines),
    skills: extractSkills(lines),
    roles: extractRoles(lines),
    education: extractEducation(lines)
  };
}

/**
 * 🔹 SUMMARY
 */
function extractSummary(lines) {
  return lines.find(l => l.length > 80) || "";
}

/**
 * 🔹 SKILLS (clean, short lines only)
 */
function extractSkills(lines) {
  return lines
    .filter(l =>
      l.length < 60 &&
      !l.includes("@") &&
      !l.includes("|") &&
      !l.match(/\d{4}/)
    )
    .slice(0, 8);
}

/**
 * 🔹 ROLES (STRICT)
 */
function extractRoles(lines) {
  const roles = [];
  let current = null;

  for (let line of lines) {
    const isRoleHeader =
      line.includes("—") ||
      (line.includes("|") && line.match(/\d{4}/));

    if (isRoleHeader) {
      if (current) roles.push(current);

      current = {
        title: line,
        bullets: []
      };
      continue;
    }

    // bullet filter
    if (
      current &&
      line.length > 40 &&
      line.length < 180 &&
      !line.includes("@") &&
      !line.toLowerCase().includes("summary") &&
      !line.toLowerCase().includes("competencies") &&
      !line.toLowerCase().includes("skills") &&
      current.bullets.length < 4
    ) {
      current.bullets.push(line);
    }
  }

  if (current) roles.push(current);

  return roles.slice(0, 3);
}

/**
 * 🔹 EDUCATION
 */
function extractEducation(lines) {
  return lines
    .filter(l =>
      l.toLowerCase().includes("university") ||
      l.toLowerCase().includes("mba") ||
      l.toLowerCase().includes("ba")
    )
    .map(l => ({
      degree: l,
      field: "",
      institution: ""
    }))
    .slice(0, 2);
}

/**
 * 🧠 MATCHING (IMPROVED + BALANCED)
 */
function analyzeRequirementsWithTrace(resume, requirements = []) {
  const partial = [];
  const missing = [];
  const trace = [];

  const STOPWORDS = new Set([
    "the","and","with","that","this","from","including",
    "across","within","ensure","drive","support","lead",
    "role","client","seeking","ideal","candidate","will",
    "provide","overall","alignment"
  ]);

  const GENERIC = new Set([
    "program","management","delivery","governance"
  ]);

  const allBullets = resume.roles.flatMap((r, ri) =>
    r.bullets.map((b, bi) => ({
      text: b,
      roleIndex: ri,
      bulletIndex: bi,
      norm: normalizeText(b)
    }))
  );

  for (let req of requirements) {
    const r = normalizeText(req);

    const words = r
      .split(" ")
      .filter(w =>
        w.length > 4 &&
        !STOPWORDS.has(w)
      );

    const scored = allBullets.map(b => {
      let score = 0;

      for (let w of words) {
        if (b.norm.includes(w)) {
          if (GENERIC.has(w)) {
            score += 0.5;
          } else {
            score += 2;
          }
        }
      }

      // intent boosts
      if (r.includes("steering") && b.norm.includes("executive")) {
        score += 3;
      }

      if (r.includes("dependencies") && b.norm.includes("integration")) {
        score += 3;
      }

      if (r.includes("servicenow") && b.norm.includes("erp")) {
        score += 2;
      }

      // penalize generic-heavy bullets
      const genericHits = ["program","delivery","governance"]
        .filter(g => b.norm.includes(g)).length;

      if (genericHits >= 2) score -= 1;

      if (score < 2) score = 0;

      return { ...b, score };
    });

    const sorted = scored.sort((a, b) => b.score - a.score);

    // prevent same bullet dominating
    const unique = [];
    const seen = new Set();

    for (let s of sorted) {
      if (s.score === 0) continue;

      if (!seen.has(s.text)) {
        unique.push(s);
        seen.add(s.text);
      }

      if (unique.length === 2) break;
    }

    if (unique.length > 0) {
      partial.push(req);

      trace.push({
        requirement: req,
        status: "partial",
        evidence: unique
      });
    } else {
      missing.push(req);

      trace.push({
        requirement: req,
        status: "missing",
        evidence: []
      });
    }
  }

  const total = requirements.length || 1;

  const coverage = Math.round(
    (partial.length / total) * 100
  );

  const score = Math.min(
    9,
    Math.round((coverage / 10) * 10) / 10
  );

  return {
    score,
    coverage,
    partial,
    missing,
    trace
  };
}

/**
 * ✅ EXPORT (CRITICAL)
 */
module.exports = {
  generateNarrativeOSResume
};
