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
 * 🧱 VERY SAFE PARSER (no hallucination)
 */
function parseResume(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  return {
    header: lines[0] || "Candidate",
    summary: lines.slice(1, 4).join(" ") || "",
    skills: extractSkills(lines),
    roles: extractRoles(lines),
    education: extractEducation(lines)
  };
}

/**
 * 🔹 SKILLS (simple extraction)
 */
function extractSkills(lines) {
  return lines
    .filter(l => l.length < 60)
    .slice(0, 8);
}

/**
 * 🔹 ROLES (3 roles max, 4 bullets each)
 */
function extractRoles(lines) {
  const roles = [];
  let current = null;

  for (let line of lines) {
    if (line.includes("|") || line.includes("—")) {
      if (current) roles.push(current);

      current = {
        title: line,
        company: "",
        bullets: []
      };

    } else if (current && current.bullets.length < 4) {
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
    .filter(l => l.toLowerCase().includes("university"))
    .map(l => ({
      degree: l,
      field: "",
      institution: ""
    }))
    .slice(0, 2);
}

/**
 * 🧠 IMPROVED MATCHING
 */
function analyzeRequirementsWithTrace(resume, requirements = []) {
  const matched = [];
  const partial = [];
  const missing = [];
  const trace = [];

  const STOPWORDS = new Set([
    "the","and","with","that","this","from",
    "including","across","within","ensure",
    "drive","support","lead"
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

    const reqWords = r
      .split(" ")
      .filter(w => w.length > 4 && !STOPWORDS.has(w));

    const scored = allBullets.map(b => {
      let score = 0;

      for (let word of reqWords) {
        if (b.norm.includes(word)) score += 2;
      }

      if (r.includes("executive steering") && b.norm.includes("executive")) {
        score += 3;
      }

      if (r.includes("governance") && b.norm.includes("governance")) {
        score += 3;
      }

      if (r.includes("dependencies") && b.norm.includes("integration")) {
        score += 2;
      }

      if (b.norm.includes("program")) score += 1;

      if (score < 2) score = 0;

      return { ...b, score };
    });

    const sorted = scored.sort((a, b) => b.score - a.score);
    const best = sorted.filter(s => s.score > 0);

    if (best.length > 0) {
      partial.push(req);

      trace.push({
        requirement: req,
        status: "partial",
        evidence: best.slice(0, 2)
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
    ((partial.length * 0.7) / total) * 100
  );

  const score = Math.round((coverage / 10) * 10) / 10;

  return {
    score,
    coverage,
    matched,
    partial,
    missing,
    trace
  };
}

/**
 * ✅ CRITICAL EXPORT (THIS FIXES YOUR ERROR)
 */
module.exports = {
  generateNarrativeOSResume
};
