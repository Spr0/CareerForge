import { generateNarrativeOSResume } from "./narrative_os_engine.js";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const result = await generateNarrativeOSResume({
      resumeData: body.resume,
      jobRequirements: body.requirements
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
