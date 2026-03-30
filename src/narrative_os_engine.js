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
