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
 * 🔥 TRACEABLE SCORING
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

      trace.push({
        requirement: req,
        status: "matched",
        evidence: strongMatches.slice(0, 2)
      });

    } else if (weakMatches.length) {
      partial.push(req);

      trace.push({
        requirement: req,
        status: "partial",
        evidence: weakMatches.slice(0, 2)
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
    ((matched.length + partial.length * 0.6) / total) * 100
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
 * ===== KEEP EVERYTHING ELSE UNCHANGED =====
 * (copy your current working functions below this line)
 */
