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

  const jdPhrases = extractJDPhrases(cleanedRequirements);

  const analysis = analyzeRequirements(normalized, cleanedRequirements);

  const summary = buildSummary(normalized, jdPhrases);

  return {
    header: normalized.header || "Candidate",
    summary,
    skills: normalized.skills || [],
    roles,
    education: normalized.education || [],
    analysis,
    jdPhrases // 🔥 NEW (for next step)
  };
}

/**
 * PARSER
 */
async function parseResume(rawText) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 700,
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
    return {
      header: rawText.split("\n")[0] || "Candidate",
      skills: [],
      roles: [],
      education: []
    };
  }
}

/**
 * CLEAN JD
 */
function cleanRequirements(reqs = []) {
  return reqs
    .map(r => r.trim())
    .filter(r =>
      r.length > 20 &&
      !r.toLowerCase().includes("linkedin") &&
      !r.toLowerCase().includes("apply") &&
      !r.toLowerCase().includes("people")
    )
    .slice(0, 10);
}

/**
 * 🔥 EXTRACT JD PHRASES (NEW)
 */
function extractJDPhrases(requirements) {
  return requirements.map(r => {
    return r
      .replace(/[^\w\s]/g, "")
      .split(" ")
      .slice(0, 6)
      .join(" ");
  });
}

/**
 * 🔥 CAPABILITY SCORING (same as before)
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
    const variants = expandRequirement(req);

    let strong = false;
    let weak = false;

    for (let v of variants) {
      const normalized = normalizeText(v);

      if (resumeText.includes(normalized)) {
        strong = true;
        break;
      }

      if (isWeakMatch(normalized, resumeText)) {
        weak = true;
      }
    }

    if (strong) matched.push(req);
    else if (weak) partial.push(req);
    else missing.push(req);
  }

  const total = requirements.length || 1;

  const coverage = Math.round(
    ((matched.length + partial.length * 0.7) / total) * 100
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
 * CAPABILITY MAP
 */
function expandRequirement(req) {
  const r = req.toLowerCase();

  const map = [
    {
      key: "servicenow",
      expand: ["platform implementation", "enterprise systems"]
    },
    {
      key: "program manager",
      expand: ["program governance", "delivery leadership"]
    }
  ];

  let expanded = [r];

  for (let rule of map) {
    if (r.includes(rule.key)) {
      expanded.push(...rule.expand);
    }
  }

  return expanded;
}

/**
 * SUMMARY (now uses JD phrases)
 */
function buildSummary(resume, jdPhrases = []) {
  const roles = resume.roles?.map(r => r.title).join(", ");
  const skills = resume.skills?.slice(0, 4).join(", ");

  const jd = jdPhrases.slice(0, 2).join(", ");

  return `${roles} professional with experience in ${skills}. Aligned with ${jd}.`;
}

/**
 * UTIL
 */
function normalizeText(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

function isWeakMatch(req, text) {
  const words = req.split(" ").filter(w => w.length > 4);
  return words.some(w => text.includes(w));
}

function enforceRoles(roles = []) {
  if (!roles.length) {
    return [{
      title: "Experience",
      company: "",
      dates: "",
      bullets: ["Experience not parsed"]
    }];
  }

  return roles.slice(0, 3).map(r => ({
    ...r,
    bullets: (r.bullets || []).slice(0, 4)
  }));
}

function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : "{}";
}

module.exports = {
  generateNarrativeOSResume
};
