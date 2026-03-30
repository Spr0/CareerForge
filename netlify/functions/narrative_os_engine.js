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
  const normalized = await parseResume(resumeData);

  const roles = enforceRoles(normalized.roles);

  const cleanedRequirements = cleanRequirements(jobRequirements);

  const analysis = analyzeRequirements(normalized, cleanedRequirements);

  const summary = buildSummary(normalized);

  return {
    header: normalized.header || "Candidate",
    summary,
    skills: normalized.skills || [],
    roles,
    education: normalized.education || [],
    analysis
  };
}

/**
 * PARSER (unchanged stable)
 */
async function parseResume(rawText) {
  try {
    const prompt = `
Extract resume JSON.

RULES:
- No hallucination
- Max 3 roles
- Max 4 bullets per role

FORMAT:
{
  "header": "",
  "skills": [],
  "roles": [],
  "education": []
}

RESUME:
${rawText}
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }]
    });

    const text = res.choices[0].message.content;
    return JSON.parse(extractJSON(text));
  } catch {
    return {
      header: rawText.split("\n")[0] || "Candidate",
      skills: [],
      roles: [],
      education: []
    };
  }
}

/**
 * CLEAN JD (🔥 CRITICAL)
 */
function cleanRequirements(reqs = []) {
  return reqs
    .map(r => r.trim())
    .filter(r =>
      r.length > 20 &&
      !r.toLowerCase().includes("apply") &&
      !r.toLowerCase().includes("linkedin") &&
      !r.toLowerCase().includes("people") &&
      !r.toLowerCase().includes("location") &&
      !r.toLowerCase().includes("click")
    )
    .slice(0, 10);
}

/**
 * SMART SCORING (🔥 MAJOR UPGRADE)
 */
function analyzeRequirements(resume, requirements = []) {
  const resumeText = normalizeText([
    ...(resume.skills || []),
    ...(resume.roles || []).flatMap(r => r.bullets || [])
  ].join(" "));

  const matched = [];
  const partial = [];
  const missing = [];

  for (let req of requirements) {
    const r = normalizeText(req);

    if (isStrongMatch(r, resumeText)) {
      matched.push(req);
    } else if (isWeakMatch(r, resumeText)) {
      partial.push(req);
    } else {
      missing.push(req);
    }
  }

  const total = requirements.length || 1;

  const coverage = Math.round(
    ((matched.length + partial.length * 0.6) / total) * 100
  );

  const score = Math.round((coverage / 10) * 10) / 10;

  return {
    score,
    coverage,
    matched,
    partial,
    missing
  };
}

/**
 * TEXT NORMALIZATION
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * STRONG MATCH
 */
function isStrongMatch(req, text) {
  return text.includes(req);
}

/**
 * WEAK MATCH (🔥 smarter)
 */
function isWeakMatch(req, text) {
  const words = req.split(" ").filter(w => w.length > 4);
  const matches = words.filter(w => text.includes(w));

  return matches.length >= Math.ceil(words.length / 2);
}

/**
 * SUMMARY (fast)
 */
function buildSummary(resume) {
  const roles = resume.roles?.map(r => r.title).join(", ");
  const skills = resume.skills?.slice(0, 5).join(", ");

  return `${roles} professional with experience in ${skills}.`;
}

/**
 * ENSURE ROLES
 */
function enforceRoles(roles = []) {
  if (!roles.length) {
    return [
      {
        title: "Experience",
        company: "",
        dates: "",
        bullets: ["Experience details not parsed"]
      }
    ];
  }

  return roles.slice(0, 3).map(r => ({
    ...r,
    bullets: (r.bullets || []).slice(0, 4)
  }));
}

/**
 * JSON EXTRACT
 */
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : "{}";
}

module.exports = {
  generateNarrativeOSResume
};
