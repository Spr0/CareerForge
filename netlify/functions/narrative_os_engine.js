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
  console.log("⚙️ ENGINE START");

  const normalized = await parseResume(resumeData);

  const roles = enforceRoles(normalized.roles);

  const summary = await generateSummary(normalized, jobRequirements);

  return {
    header: normalized.header || "Candidate",
    summary,
    skills: normalized.skills || [],
    roles,
    education: normalized.education || ""
  };
}

/**
 * 🔥 STRONG PARSER
 */
async function parseResume(rawText) {
  try {
    const prompt = `
You are a resume parser.

STRICT RULES:
- Extract REAL content only (no placeholders)
- DO NOT write generic summaries
- DO NOT invent experience
- ALWAYS extract at least 1 role if any experience exists

FORMAT (VALID JSON ONLY):
{
  "header": "name",
  "skills": ["skill1", "skill2"],
  "roles": [
    {
      "title": "",
      "company": "",
      "dates": "",
      "bullets": ["", "", ""]
    }
  ],
  "education": [
    {
      "degree": "",
      "field": "",
      "institution": ""
    }
  ]
}

RESUME:
${rawText}
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: prompt }]
    });

    const text = res.choices[0].message.content;
    const json = extractJSON(text);

    return JSON.parse(json);
  } catch (e) {
    console.error("PARSE ERROR:", e);

    return {
      header: rawText.split("\n")[0] || "Candidate",
      skills: [],
      roles: [],
      education: []
    };
  }
}

/**
 * ENSURE ROLES EXIST
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

  return roles.slice(0, 3).map((role) => ({
    ...role,
    bullets: (role.bullets || []).slice(0, 4)
  }));
}

/**
 * CLEAN JSON
 */
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : "{}";
}

/**
 * REAL SUMMARY (NO GENERIC FILLER)
 */
async function generateSummary(resume, jobRequirements) {
  try {
    const prompt = `
Write a concise professional summary using ONLY real experience.

RULES:
- Max 60 words
- No placeholders like [your industry]
- No generic fluff
- Use actual roles and skills

ROLES:
${resume.roles?.map(r => r.title).join(", ")}

SKILLS:
${resume.skills?.join(", ")}

TARGET JOB:
${jobRequirements?.slice(0, 5).join(", ")}
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }]
    });

    return res.choices[0].message.content.trim();
  } catch {
    return "";
  }
}

module.exports = {
  generateNarrativeOSResume
};
