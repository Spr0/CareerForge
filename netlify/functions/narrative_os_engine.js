const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * ENTRY
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

  const analysis = analyzeRequirements(
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
 * 🔥 SPLIT INTO SECTIONS (CRITICAL FIX)
 */
function splitSections(text) {
  const lines = text.split("\n");

  let current = "header";

  const sections = {
    header: [],
    skills: [],
    experience: [],
    education: []
  };

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

/**
 * PARSER (unchanged)
 */
async function parseResume(rawText) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `
Extract resume JSON.

FORMAT:
{
  "header": "",
  "skills": [],
  "roles": [],
  "education": []
}

RESUME:
${rawText}
`
      }]
    });

    return JSON.parse(extractJSON(res.choices[0].message.content));
  } catch {
    return {};
  }
}

/**
 * 🔥 SKILLS (STRICT)
 */
function normalizeSkills(llmSkills = [], sectionLines = []) {
  let base = llmSkills.length ? llmSkills : sectionLines;

  return base
    .flatMap(s => s.split("|"))
    .map(s => s.trim())
    .filter(s =>
      s.length > 2 &&
      s.length < 40 &&
      !s.match(/\d{3}/) && // remove phone
      !s.includes(",") &&  // remove addresses
      !s.includes(".")     // remove sentences
    )
    .slice(0, 10);
}

/**
 * 🔥 ROLES (SECTION-BOUND)
 */
function normalizeRoles(llmRoles = [], experienceLines = []) {
  if (llmRoles.length && llmRoles.some(r => r.bullets?.length)) {
    return llmRoles.slice(0, 3).map(r => ({
      ...r,
      bullets: r.bullets.slice(0, 4)
    }));
  }

  // fallback using experience section only
  const roles = [];
  let current = null;

  for (let line of experienceLines) {
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

/**
 * 🔥 EDUCATION (STRICT FIX)
 */
function normalizeEducation(llmEdu = [], sectionLines = []) {
  let base = llmEdu.length ? llmEdu : sectionLines;

  return base
    .filter(e =>
      e.toLowerCase().includes("university") ||
      e.toLowerCase().includes("mba") ||
      e.toLowerCase().includes("ba")
    )
    .map(e => ({
      degree: typeof e === "string" ? e : e.degree
    }))
    .slice(0, 2);
}

/**
 * CLEAN JD
 */
function cleanRequirements(reqs = []) {
  return reqs
    .map(r => r.trim())
    .filter(r => r.length > 25)
    .slice(0, 8);
}

/**
 * SCORING
 */
function analyzeRequirements(resume, requirements = []) {
  const text = normalizeText([
    ...(resume.skills || []),
    ...(resume.roles || []).flatMap(r => r.bullets || [])
  ].join(" "));

  const matched = [];
  const partial = [];
  const missing = [];

  for (let req of requirements) {
    const r = normalizeText(req);

    if (text.includes(r)) matched.push(req);
    else if (isWeakMatch(r, text)) partial.push(req);
    else missing.push(req);
  }

  const total = requirements.length || 1;

  const coverage = Math.round(
    ((matched.length + partial.length * 0.6) / total) * 100
  );

  const score = Math.round((coverage / 10) * 10) / 10;

  return { score, coverage, matched, partial, missing };
}

/**
 * SUMMARY
 */
function buildSummary(roles, skills) {
  const roleTitles = roles.map(r => r.title).slice(0, 2).join(", ");
  const skillList = skills.slice(0, 4).join(", ");

  return `${roleTitles} professional with expertise in ${skillList}.`;
}

/**
 * UTILS
 */
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

module.exports = {
  generateNarrativeOSResume
};
