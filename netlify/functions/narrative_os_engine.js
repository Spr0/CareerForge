const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * MAIN FUNCTION (must be exported)
 */
async function generateNarrativeOSResume({
  resumeData,
  jobRequirements
}) {
  const sections = splitSections(resumeData);
  const parsed = await parseResume(resumeData);

  const roles = normalizeRoles(parsed.roles, sections.experience);
  const skills = normalizeSkills(parsed.skills, sections.skills);
  const education = normalizeEducation(parsed.education, sections.education);

  const cleanedRequirements = cleanRequirements(jobRequirements);

  const analysis = analyzeRequirementsWithTrace(
    { skills, roles },
    cleanedRequirements
  );

  const summary = buildSummary(roles, skills);

  return {
    header: parsed.header || sections.header,
    summary,
    skills,
    roles,
    education,
    analysis
  };
}

/**
 * TRACEABLE SCORING
 */
function analyzeRequirementsWithTrace(resume, requirements = []) {
  const matched = [];
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

    let strongMatches = [];
    let weakMatches = [];

    for (let bullet of allBullets) {
      if (bullet.norm.includes(r)) {
        strongMatches.push(bullet);
      } else if (isWeakMatch(r, bullet.norm)) {
        weakMatches.push(bullet);
      }
    }

    if (strongMatches.length) {
      matched.push(req);
      trace.push({ requirement: req, status: "matched", evidence: strongMatches.slice(0, 2) });
    } else if (weakMatches.length) {
      partial.push(req);
      trace.push({ requirement: req, status: "partial", evidence: weakMatches.slice(0, 2) });
    } else {
      missing.push(req);
      trace.push({ requirement: req, status: "missing", evidence: [] });
    }
  }

  const total = requirements.length || 1;

  const coverage = Math.round(
    ((matched.length + partial.length * 0.6) / total) * 100
  );

  const score = Math.round((coverage / 10) * 10) / 10;

  return { score, coverage, matched, partial, missing, trace };
}

/**
 * ===== EXISTING HELPERS (UNCHANGED) =====
 */

function splitSections(text) {
  const lines = text.split("\n");
  let current = "header";

  const sections = { header: [], skills: [], experience: [], education: [] };

  for (let line of lines) {
    const l = line.toLowerCase();

    if (l.includes("skills")) current = "skills";
    else if (l.includes("experience")) current = "experience";
    else if (l.includes("education")) current = "education";

    sections[current].push(line);
  }

  return {
    header: sections.header.join(" "),
    skills: sections.skills,
    experience: sections.experience,
    education: sections.education
  };
}

async function parseResume(rawText) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Extract resume JSON from:\n${rawText}`
      }]
    });

    return JSON.parse(extractJSON(res.choices[0].message.content));
  } catch {
    return {};
  }
}

function normalizeSkills(skills = [], lines = []) {
  return (skills.length ? skills : lines)
    .flatMap(s => s.split("|"))
    .map(s => s.trim())
    .filter(s => s.length > 2 && s.length < 40 && !s.includes("."))
    .slice(0, 10);
}

function normalizeRoles(roles = [], lines = []) {
  if (roles.length && roles.some(r => r.bullets?.length)) {
    return roles.slice(0, 3).map(r => ({
      ...r,
      bullets: r.bullets.slice(0, 4)
    }));
  }

  return extractRoles(lines.join("\n"));
}

function normalizeEducation(edu = [], lines = []) {
  return (edu.length ? edu : lines)
    .filter(e => e.toLowerCase().includes("university"))
    .map(e => ({ degree: typeof e === "string" ? e : e.degree }))
    .slice(0, 2);
}

function extractRoles(text) {
  const lines = text.split("\n");
  const roles = [];
  let current = null;

  for (let line of lines) {
    if (line.includes("|")) {
      if (current) roles.push(current);

      const parts = line.split("|");

      current = {
        title: parts[0]?.trim(),
        company: parts[1]?.trim(),
        bullets: []
      };
    } else if (current && line.length > 40) {
      current.bullets.push(line.trim());
    }
  }

  if (current) roles.push(current);

  return roles.slice(0, 3);
}

function cleanRequirements(reqs = []) {
  return reqs.map(r => r.trim()).filter(r => r.length > 25).slice(0, 8);
}

function buildSummary(roles, skills) {
  const roleTitles = roles.map(r => r.title).slice(0, 2).join(", ");
  const skillList = skills.slice(0, 4).join(", ");

  return `${roleTitles} professional with expertise in ${skillList}.`;
}

function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

function isWeakMatch(req, text) {
  const words = req.split(" ").filter(w => w.length > 4);
  return words.some(w => text.includes(w));
}

function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : "{}";
}

/**
 * 🔥 CRITICAL FIX (THIS WAS MISSING)
 */
module.exports = {
  generateNarrativeOSResume
};
