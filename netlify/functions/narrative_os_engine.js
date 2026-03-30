function normalizeText(text = "") {
  return text.toLowerCase();
}

/**
 * 🧠 MAIN
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
 * 🧱 CLEAN PARSER
 */
function parseResume(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  return {
    header: lines[0] || "Candidate",
    summary: extractSummary(lines),
    skills: extractSkills(lines),
    roles: extractRoles(lines),
    education: extractEducation(lines)
  };
}

/**
 * 🔹 SUMMARY (first paragraph only)
 */
function extractSummary(lines) {
  return lines.find(l => l.length > 80) || "";
}

/**
 * 🔹 SKILLS (short lines only)
 */
function extractSkills(lines) {
  return lines
    .filter(l =>
      l.length < 60 &&
      !l.includes("@") &&
      !l.includes("|")
    )
    .slice(0, 8);
}

/**
 * 🔹 ROLES (strict filtering)
 */
function extractRoles(lines) {
  const roles = [];
  let current = null;

  for (let line of lines) {
    const isHeader =
      line.includes("|") ||
      line.includes("—") ||
      line.match(/\d{4}/);

    if (isHeader) {
      if (current) roles.push(current);

      current = {
        title: line,
        bullets: []
      };
      continue;
    }

    // 🔥 BULLET FILTER
    if (
      current &&
      line.length < 180 &&
      !line.includes("@") &&
      !line.toLowerCase().includes("summary") &&
      !line.toLowerCase().includes("competencies") &&
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
 * 🧠 MATCHING (unchanged logic, now with clean bullets)
 */
function analyzeRequirementsWithTrace(resume, requirements = []) {
  const partial = [];
  const missing = [];
  const trace = [];

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
    const reqWords = r.split(" ").filter(w => w.length > 4);

    const scored = allBullets.map(b => {
      let score = 0;

      for (let word of reqWords) {
        if (b.norm.includes(word)) score += 2;
      }

      if (r.includes("governance") && b.norm.includes("governance")) score += 3;
      if (r.includes("executive") && b.norm.includes("executive")) score += 2;

      if (score < 2) score = 0;

      return { ...b, score };
    });

    const best = scored
      .sort((a, b) => b.score - a.score)
      .filter(s => s.score > 0);

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
  const coverage = Math.round((partial.length / total) * 100);
  const score = Math.round((coverage / 10) * 10) / 10;

  return {
    score,
    coverage,
    partial,
    missing,
    trace
  };
}

module.exports = {
  generateNarrativeOSResume
};
