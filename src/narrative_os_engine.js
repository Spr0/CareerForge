import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * ENTRY POINT
 */
export async function generateNarrativeOSResume({
  resumeData,
  jobRequirements
}) {
  const normalized = normalizeResume(resumeData);

  const requirementMap = mapRequirementsToResume(
    jobRequirements,
    normalized
  );

  const enhancedRoles = await buildRolesDeterministically(
    normalized.roles,
    requirementMap,
    normalized
  );

  const summary = await generateSummary(normalized, jobRequirements);

  const finalResume = assembleResume({
    header: normalized.header,
    summary,
    skills: normalized.skills,
    roles: enhancedRoles,
    education: normalized.education
  });

  validateFinalResume(finalResume);

  return finalResume;
}

/**
 * NORMALIZE INPUT
 */
function normalizeResume(resume) {
  return {
    header: resume.header || "",
    summary: resume.summary || "",
    skills: resume.skills || [],
    roles: (resume.roles || []).slice(0, 3),
    education: resume.education || ""
  };
}

/**
 * REQUIREMENT MAP (stub — keep your existing scoring logic if you want)
 */
function mapRequirementsToResume(requirements) {
  return requirements.map(req => ({
    text: req,
    status: "matched"
  }));
}

/**
 * BUILD ROLES WITH HARD LIMITS
 */
async function buildRolesDeterministically(
  roles,
  requirementMap,
  resume
) {
  const finalRoles = [];

  for (let role of roles.slice(0, 3)) {
    const bullets = [];

    // Keep original bullets (max 4)
    const originalBullets = (role.bullets || []).slice(0, 4);

    for (let bullet of originalBullets) {
      bullets.push(trimBullet(bullet));
    }

    // Fill missing bullets
    const needed = 4 - bullets.length;

    if (needed > 0) {
      const generated = await generateBulletsBatch({
        role,
        resume,
        requirementMap,
        count: needed
      });

      bullets.push(...generated);
    }

    finalRoles.push({
      ...role,
      bullets: bullets.slice(0, 4)
    });
  }

  return finalRoles;
}

/**
 * GENERATE BULLETS
 */
async function generateBulletsBatch({
  role,
  resume,
  requirementMap,
  count
}) {
  const bullets = [];

  for (let i = 0; i < count; i++) {
    const bullet = await generateSingleBullet({
      role,
      resume,
      requirement: requirementMap[i]
    });

    if (bullet) bullets.push(trimBullet(bullet));
  }

  return bullets;
}

async function generateSingleBullet({
  role,
  resume,
  requirement
}) {
  const prompt = `
You are enhancing a resume bullet.

STRICT RULES:
- Use ONLY existing experience
- Do NOT invent tools, metrics, or roles
- Max 25 words
- One sentence
- Start with strong action verb

ROLE:
${role.title} at ${role.company}

EXISTING BULLETS:
${(role.bullets || []).join("\n")}

TARGET REQUIREMENT:
${requirement?.text || "general impact"}

Write ONE bullet:
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content.trim();
}

/**
 * CLEAN BULLETS
 */
function trimBullet(text) {
  if (!text) return "";

  let cleaned = text
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.split(" ").slice(0, 25).join(" ");
}

/**
 * SUMMARY
 */
async function generateSummary(resume, jobRequirements) {
  const prompt = `
Write a professional summary.

RULES:
- Max 80 words
- No hallucinations
- Align to job requirements

ROLES:
${resume.roles.map(r => `${r.title} at ${r.company}`).join("\n")}

REQUIREMENTS:
${jobRequirements.slice(0, 5).join("\n")}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }]
  });

  return res.choices[0].message.content.trim();
}

/**
 * FINAL STRUCTURE
 */
function assembleResume({
  header,
  summary,
  skills,
  roles,
  education
}) {
  return {
    header,
    summary,
    skills: skills.slice(0, 12),
    roles: roles.map(role => ({
      title: role.title,
      company: role.company,
      dates: role.dates,
      bullets: role.bullets.slice(0, 4)
    })),
    education
  };
}

/**
 * VALIDATION
 */
function validateFinalResume(resume) {
  if (!resume.header) throw new Error("Missing header");
  if (!resume.summary) throw new Error("Missing summary");
  if (!resume.education) throw new Error("Missing education");

  for (let role of resume.roles) {
    if (!role.bullets.length) {
      throw new Error(`Missing bullets in ${role.title}`);
    }
  }
}
