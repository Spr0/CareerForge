// NarrativeOS v21 — Hybrid Resume Mode + Hankel Language Framework
// Key changes from v20:
//   - Resume type selector: Chronological / Hybrid / Functional (each with distinct render prompts)
//   - Hankel language framework baked into all three resume prompts
//   - Story hooks updated with proof→potential bridge format
//   - Cover letter gets high-commitment framing
//   - RoleWorkspace: auto-extracts company+title from JD analysis; fixes onBuildResume
//   - BottomNav: "Analyze" renamed to "Fit Check"
//   - AnalyzeTab: returns role+company via onBuildResume callback

import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONSTANTS & CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const COMPETENCIES = [
  "Transformation","Financial Impact","Leadership","Technical",
  "Agile/Delivery","Governance","Vendor Management","Strategy","Stakeholder",
];

const STAGES = ["Radar","Applied","Screening","Interview","Offer","Pass"];

const STAGE_COLORS = {
  Radar:     { bg: "rgba(99,140,255,0.12)",  border: "#4f6ef7", text: "#8aacff" },
  Applied:   { bg: "rgba(251,191,36,0.10)",  border: "#d97706", text: "#fbbf24" },
  Screening: { bg: "rgba(168,85,247,0.10)",  border: "#9333ea", text: "#c084fc" },
  Interview: { bg: "rgba(34,197,94,0.10)",   border: "#16a34a", text: "#4ade80" },
  Offer:     { bg: "rgba(20,184,166,0.10)",  border: "#0d9488", text: "#2dd4bf" },
  Pass:      { bg: "rgba(100,116,139,0.10)", border: "#475569", text: "#94a3b8" },
};

const RESUME_TYPES = [
  { id: "chronological", label: "Chronological", desc: "Reverse-chron with Hankel upgrades. Best for roles matching your exact path." },
  { id: "hybrid",        label: "Hybrid",        desc: "Potential-first bullets anchored by proof. Best for stretch roles." },
  { id: "functional",    label: "Functional",    desc: "Competency-grouped. Best for pivots or when recency hurts." },
];

function getToday() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const DEFAULT_PROFILE = {
  name: "", displayName: "", email: "", phone: "",
  address: "Bellingham, WA", linkedin: "", website: "",
  title: "", background: "", resumeText: "", resumeUploaded: false,
  profileTier: "senior",
  resumeVariants: [],
  activeResumeId: null,
};

const RESEARCH_STEPS = [
  { key: "overview",       label: "Company overview & structure",          query: c => `${c} company overview mission revenue employees structure 2024 2025` },
  { key: "leadership",     label: "Leadership & org structure",             query: c => `${c} executive leadership team CEO CTO VP org structure 2025` },
  { key: "financials",     label: "Financial health & stability",           query: c => `${c} financial results revenue growth funding stability 2024 2025` },
  { key: "transformation", label: "Transformation & strategic initiatives", query: c => `${c} digital transformation technology strategy initiatives 2024 2025` },
];

const OPTIONAL_STEPS = [
  { key: "news",    label: "＋ Recent News",     query: c => `${c} news announcements 2025` },
  { key: "culture", label: "＋ Culture Signals", query: c => `${c} company culture values employee reviews Glassdoor 2025` },
];

function tierContext(profile) {
  const tier = profile.profileTier || "senior";
  const map = {
    student:   { voice: "Use encouraging, coaching tone. Avoid jargon.", scope: "Focus on internships, academic projects, transferable skills, and early-career potential.", expectations: "Do not expect P&L ownership, large team leadership, or deep domain expertise.", questions: "Interview questions should focus on behavioral basics, learning mindset, and role-specific skills." },
    midlevel:  { voice: "Professional, direct tone. Assume familiarity with core business concepts.", scope: "Focus on individual contribution, team collaboration, and early leadership.", expectations: "Expect 3-8 years of experience. Some management experience may be present but not required.", questions: "Interview questions should probe execution quality, stakeholder navigation, and growth into leadership." },
    senior:    { voice: "Peer-level, direct tone. Skip basics. Lead with impact and strategic framing.", scope: "Focus on program/portfolio ownership, cross-functional influence, and measurable outcomes.", expectations: "Expect 8-15 years. Director or senior manager scope. P&L exposure likely but may not be full ownership.", questions: "Interview questions should probe leadership under ambiguity, organizational influence, and business outcomes." },
    executive: { voice: "Boardroom-level, concise, commercially framed. No hand-holding.", scope: "Focus on P&L ownership, organizational transformation, C-suite and board relationships, and enterprise outcomes.", expectations: "Expect VP+ scope. Full P&L, revenue accountability, and multi-year transformation programs are baseline.", questions: "Interview questions should probe strategic vision, enterprise risk, talent philosophy, and financial stewardship." },
  };
  return map[tier] || map.senior;
}

// ─────────────────────────────────────────────────────────────────────────────
// HANKEL FRAMEWORK — shared language constants for all resume prompts
// ─────────────────────────────────────────────────────────────────────────────

const _HANKEL_BANNED = `BANNED outdated phrases — never use:
"team player," "results-oriented," "seasoned professional," "go-getter," "synergy,"
"thrives in fast-paced environments," "works well under pressure," "strategic thinker" (vague),
"multi-tasker," "dynamic leader," "bottom-line focus," "excellent communication skills,"
"hard worker," "self-starter," "people person," "proven track record," "detail-oriented"`;

const _HANKEL_UPGRADE = `FADING terms — upgrade these:
"change management" → "transformation leadership" or "change agility"
"stakeholder communication" → "cross-functional fluency"
"process development" → pair with automation/efficiency language
"cross-functional collaboration" → add specifics (team count, outcome)
"project management" → tie to methodology (SAFe, Kanban, Agile) or scope`;

const _HANKEL_TRENDING = `TRENDING transferable skills — use naturally:
Team Alignment, Market Adaptability, Cross-Functional Fluency, Change Agility,
Outcomes-Based Reporting, Data Storytelling, AI-Augmented Workflows, Operational Resilience,
Continuous Delivery Mindset, Internal Enablement Tools, Data-Driven Decision Support`;

const _HANKEL_AGREE = `AGREEABLENESS signals — ATS linguistic scoring rewards these:
Include stakeholder/team counts ("partnered with 40+ stakeholders," "aligned 15 contributors"),
morale/trust outcomes ("strengthening team trust," "reducing internal friction"),
cooperation language ("collaborated with," "built alignment across"),
alignment phrases ("focused on shared goals," "helps teams stay aligned").

COOPERATIVE KPI format (highest ATS scoring):
"[Potential phrase] + [cooperative context with count] + [quantified result] + [agreeableness signal]"`;

const _HANKEL_VOCAB = `PROOF vocabulary: "Expertise in," "A background in," "A strong history of," "Demonstrated success in," "Recognized strength in," "Deep knowledge of"
POTENTIAL vocabulary: "Positioned to," "Poised to," "Prepared to," "Ready to," "Equipped to," "Building momentum as"`;

const _HANKEL_HYBRID_BULLETS = `HYBRID BULLET ARCHITECTURE — Potential + Results (Hankel "Esp. Do This"):
Structure: [Potential phrase], [cooperative context], as demonstrated by [specific proof], [agreeableness signal].

Examples calibrated to this candidate:
- "Positioned to lead complex portfolio governance at expanded scale, having partnered with 75+ initiative owners to rationalize a $40M+ program while building alignment across finance, technology, and operations."
- "Poised to drive enterprise-wide AI adoption, drawing on governance framework development that reduced unsanctioned tool usage while strengthening cross-functional trust in technology decisions."
- "Prepared to own P&L accountability at increased scope, as demonstrated by delivering $28M annualized EBITDA improvement while improving stakeholder engagement across 15 initiatives."
- "Ready to lead services commercialization, building on a strong history of productizing internal capability that generated $2M+ in revenue while enabling team growth across two business units."

65% potential-first. 35% proof-anchored. EVERY bullet has at least one quantified result.
Do NOT lead bullets with pure performance metrics ("Drove 30% revenue increase").`;

const _PAGE_RULES = `PAGE LIMIT — DENSE 2 PAGES:
- Bullet distribution (total 20-22 bullets): Cypress Creek (VP): 6-7 | EDF (Sr Dir): 5-6 | Percipio (Sr Mgr): 3-4 | Nike (Dir): 2-3 | Intel (Sr PM): 2
- Roles before Intel Corporation (Apr 2013) EXCLUDED entirely.
- Certifications: single compact line with pipe separators.
- Every bullet must be substantive. No filler.`;

const _PROJECTS = `PROJECTS SECTION — after PROFESSIONAL EXPERIENCE, before EDUCATION:
SELECTED PROJECTS
- HendersonSolution.com — Executive advisory platform; AI-assisted positioning and portfolio storytelling for senior transformation leaders
- CareerForge — AI-powered job search platform (React/Netlify); multi-profile support, STAR story library, ATS optimization, and DOCX resume generation
- ClauseLens — AI contract analysis tool; clause-level risk identification and redlining with safety and compliance guardrails`;

const _BASE_FMT = `FORMAT: No commentary, no markdown, no asterisks. Name ALL CAPS first line. Contact line second with | separators. Section headers ALL CAPS no punctuation. Job entries: Title | Company | Years. Bullets start with dash (-). Do not invent facts.`;

const PROMPTS = {

  contactExtract: () =>
    `Extract contact information from a resume. Return ONLY a JSON object with these fields (empty string if not found):
{"name":"","phone":"","email":"","address":"","linkedin":"","website":"","title":""}
- name: full legal name
- phone: phone number
- email: email address
- address: city and state only (e.g. "Seattle, WA")
- linkedin: LinkedIn URL or username
- website: personal website URL
- title: current or most recent job title
Return only the JSON, no other text.`,

  coverLetterExtract: () =>
    `Extract company name and job title from a job description. Return ONLY JSON: {"company":"...","role":"..."}. Empty string if not found.`,

  searchQueries: (profile) => {
    const tier = profile?.profileTier || "senior";
    const levelHint = {
      student:   "Target entry-level, associate, junior, coordinator, and internship roles.",
      midlevel:  "Target manager, specialist, lead, and senior individual contributor roles.",
      senior:    "Target senior manager, director, and senior director roles.",
      executive: "Target VP, SVP, EVP, Chief, and Head-of roles.",
    }[tier] || "Target senior director and VP roles.";
    return `Generate 4 concise job board search queries for this candidate.
Each query: 3-6 words, targets appropriately leveled roles, includes "remote" where appropriate.
${levelHint}
Return ONLY a JSON array of strings.`;
  },

  jobScoring: (jobCount) =>
    `You are a senior recruiter evaluating candidate fit. Score each job 1-10 based ONLY on must-have requirements — ignore preferred/nice-to-have.
Score HIGH when candidate has required certifications, domain experience, hands-on tool experience, or scope match.
Score LOW when candidate is missing explicitly required certifications, industry experience, or technical platform hands-on.
The "reason" field must be specific — name the actual requirement gap or match.
Return ONLY a JSON array: [{"index":0,"score":8,"reason":"specific one sentence"},...]
Score all ${jobCount} jobs. No preamble.`,

  jdAnalyzer: (profile, stories, corrections) => {
    const tc = tierContext(profile);
    const correctionText = Object.keys(corrections).length > 0
      ? `\n\nUSER CORRECTIONS — treat as verified facts, do NOT re-flag:\n${Object.entries(corrections).map(([k, v]) => `- "${k}": ${v}`).join("\n")}`
      : "";
    const resumeText = (profile.resumeText || "").slice(0, 1200);
    const hasStories = stories && stories.length > 0;
    const profileContext = hasStories ? `RESUME BASELINE:\n${resumeText}` : `RESUME (no stories yet — evaluate from resume only):\n${resumeText}`;
    return `You are a senior career strategist evaluating fit for ${profile.name || "this candidate"}.

CANDIDATE LEVEL: ${profile.profileTier || "senior"}
${tc.scope}
${tc.expectations}

${profileContext}${correctionText}

EVALUATION PHILOSOPHY:
Assess the whole person — career arc, demonstrated impact, and transferable experience.
A 10/10 is reserved for near-perfect alignment. A 9/10 means exceptional fit with only minor gaps.
Only flag gaps explicitly required in the JD and clearly absent from the candidate's background.
CRITICAL: Before flagging any gap, check the resume above. Only flag genuine verified gaps.

Return ONLY a valid JSON object — no markdown, no backticks:
{
  "score": <1-10>,
  "company": "<company name from JD>",
  "role": "<job title from JD>",
  "rationale": "<one energizing sentence leading with the candidate's strongest angle>",
  "keyRequirements": ["<req>","<req>","<req>","<req>","<req>"],
  "strongestAngles": [{"angle":"<angle>","why":"<1 sentence why this matters for THIS role>"}],
  "topStories": [{"story":"<story title or resume achievement>","useFor":"<interview question type>"}],
  "gaps": [{"title":"<gap>","assessment":"<honest 1-sentence>","framing":"<how to address it confidently>"}],
  "keywords": ["<kw>"]
}`;
  },

  resumeStrategy: (profile, resumeType = "chronological") => {
    const tc = tierContext(profile);
    const profileContext = [
      profile.title && `Title: ${profile.title}`,
      profile.background && `Background: ${profile.background}`,
      profile.resumeText && `Resume (first 800 chars): ${profile.resumeText.slice(0, 800)}`,
    ].filter(Boolean).join("\n");

    const typeGuidance = resumeType === "hybrid"
      ? `RESUME TYPE: HYBRID (Potential-Forward Hankel)
Strategy bullets should recommend POTENTIAL-FIRST language anchored with proof.
bulletEdits should transform purely transactional bullets into potential+proof format.
summaryRewrite should be forward-looking — what the candidate is positioned to do.`
      : resumeType === "functional"
      ? `RESUME TYPE: FUNCTIONAL (Competency-Grouped)
Strategy should recommend grouping bullets by competency.
bulletEdits should reframe bullets as demonstrated capabilities, referencing companies inline.
summaryRewrite should focus on competency areas and executive scope.`
      : `RESUME TYPE: CHRONOLOGICAL (Upgraded with Hankel)
Strategy should upgrade language per Hankel framework while preserving chronological structure.
bulletEdits should add agreeableness signals, upgrade fading vocabulary, and add potential bridges.`;

    return `You are a senior executive resume strategist for ${profile.name || "this candidate"}.
${profileContext}

CANDIDATE LEVEL: ${profile.profileTier || "senior"}
${tc.scope}
${tc.expectations}
${tc.voice}

${typeGuidance}

SCOPE: Analyze only roles from Intel Corporation (Apr 2013) forward. Roles prior to Intel are excluded.

HANKEL LANGUAGE FRAMEWORK — apply to all bullet edits:
${_HANKEL_BANNED}
${_HANKEL_UPGRADE}
${_HANKEL_TRENDING}
${_HANKEL_AGREE}
${_HANKEL_VOCAB}

Analyze the resume against the job description and return ONLY a valid JSON object — no markdown, no backticks:
{
  "summaryRewrite": "<complete 3-sentence summary rewritten for this role — forward-looking, calibrated to candidate level>",
  "bulletEdits": [
    {"original": "<exact bullet from resume>", "revised": "<stronger version using Hankel framework>", "reason": "<one sentence why>"}
  ],
  "bulletsToPromote": ["<bullet text to move higher>"],
  "keywordsToAdd": ["<keyword or phrase missing from resume but in JD>"],
  "toDeEmphasize": ["<experience or section to minimize for this application>"]
}
Return only the JSON. bulletEdits should include the 4-5 highest-impact changes only.`;
  },

  resumeRender: (resumeType = "chronological") => {
    if (resumeType === "hybrid") {
      return `You are an expert resume writer producing a HYBRID executive resume using the Hankel potential-forward framework.
Apply ALL approved edits from the strategy. Produce clean resume text only.

${_BASE_FMT}

HYBRID FORMAT:
1. Name (ALL CAPS) + Contact line
2. EXECUTIVE PROFILE section — a functional descriptor header (e.g. "Enterprise Transformation & Portfolio Leadership — VP/SVP Level") followed by 3-4 forward-looking sentences on what the candidate is positioned to do. NOT a career history recap.
3. PROFESSIONAL EXPERIENCE — reverse chronological, context sentence per role
4. ${_PROJECTS}
5. EDUCATION + CERTIFICATIONS (single compact line with pipes)

${_HANKEL_BANNED}
${_HANKEL_UPGRADE}
${_HANKEL_TRENDING}
${_HANKEL_AGREE}
${_HANKEL_HYBRID_BULLETS}

${_PAGE_RULES}`;
    }

    if (resumeType === "functional") {
      return `You are an expert resume writer producing a FUNCTIONAL executive resume.
Apply ALL approved edits from the strategy. Produce clean resume text only.

${_BASE_FMT}

FUNCTIONAL FORMAT:
1. Name (ALL CAPS) + Contact line
2. EXECUTIVE SUMMARY — 3 forward-looking sentences on scope and what the candidate is positioned to do
3. AREAS OF EXPERTISE — 4-5 competency-grouped sections:
   Headers: ENTERPRISE TRANSFORMATION | FINANCIAL STEWARDSHIP | PORTFOLIO GOVERNANCE | TECHNOLOGY & AI STRATEGY | STAKEHOLDER & COMMERCIAL LEADERSHIP
   - 3-4 bullets per section referencing companies inline ("at Cypress Creek Renewables," "during the EDF transformation program")
   - 60% potential-first, 40% proof-anchored bullets
4. PROFESSIONAL EXPERIENCE — brief list only: Title | Company | Dates (one line, NO bullets)
5. ${_PROJECTS}
6. EDUCATION + CERTIFICATIONS

${_HANKEL_BANNED}
${_HANKEL_UPGRADE}
${_HANKEL_TRENDING}
${_HANKEL_AGREE}
${_HANKEL_VOCAB}`;
    }

    // Default: Chronological with Hankel upgrades
    return `You are an expert resume writer producing a CHRONOLOGICAL resume with Hankel language upgrades.
Apply ALL approved edits from the strategy. Produce clean resume text only.

${_BASE_FMT}

CHRONOLOGICAL FORMAT:
- Reverse chronological order, full date ranges per role
- Context sentence per role: one line on what the company/BU did and its scale
- 60% PROOF-ANCHORED bullets, 40% POTENTIAL-BRIDGE bullets
- Potential bridges: "[Achievement], positioning the organization to [future outcome]"
- Mix agreeableness signals WITH hard metrics in the same bullet

${_HANKEL_BANNED}
${_HANKEL_UPGRADE}
${_HANKEL_TRENDING}
${_HANKEL_AGREE}
${_HANKEL_VOCAB}

${_PAGE_RULES}

${_PROJECTS}`;
  },

  coverLetter: (profile, company, role, notes, toneOverride) => {
    const tc = tierContext(profile);
    const profileContext = [
      profile.title && `Title: ${profile.title}`,
      profile.background && `Background: ${profile.background}`,
      profile.resumeText && `Key experience: ${profile.resumeText.slice(0, 600)}`,
    ].filter(Boolean).join("\n");
    const TONES = {
      executive: "Boardroom-level voice. Commercially framed. Lead with enterprise impact and financial outcomes. No warmth padding.",
      warm:      "Warm, collaborative tone. Lead with mission alignment and team contribution. Genuine enthusiasm without being sycophantic.",
      concise:   "Extremely tight. Every sentence earns its place. No setup paragraphs. Results first, always. 2 paragraphs maximum.",
      narrative: "Open with a brief situational story or insight that reframes the candidate's angle. Then pivot to credentials. Memorable over safe.",
    };
    const voiceInstruction = toneOverride && TONES[toneOverride]
      ? `TONE OVERRIDE: ${TONES[toneOverride]}`
      : `VOICE GUIDANCE: ${tc.voice}`;
    return `You are writing a cover letter for ${profile.name || "this candidate"}.
${profileContext}

CANDIDATE LEVEL: ${profile.profileTier || "senior"}
${voiceInstruction}
${tc.scope}

One strong opening hook — not "I am writing to apply for…"
3 tight paragraphs maximum. Close with forward momentum.

HIGH COMMITMENT SIGNAL — CRITICAL:
This letter must communicate that this specific role, at this specific company, is the destination — not a stepping stone.
Signal genuine, researched alignment — not generic enthusiasm.
One line should clearly say (without cliché): this is exactly the kind of problem I have spent years preparing to own.
Make the alignment specific and earned — reference something particular about THIS company's stage, challenge, or mandate.
Avoid vague flattery ("I've long admired your company"). Earned specificity wins.

AGREEABLENESS LANGUAGE:
- Emphasize collaborative impact alongside individual achievement
- Include partnership language: "working alongside," "in service of the team's goals," "building alignment with"
- One sentence should reference team or stakeholder outcomes, not just personal metrics
- Avoid purely competitive framing ("I single-handedly," "I outperformed")

CRITICAL FORMATTING:
- Do NOT include contact information, addresses, phone numbers, or email addresses
- Do NOT include a name line, letterhead, or salutation
- Do NOT include a closing signature block — the template adds this
- Output ONLY the body paragraphs, nothing else
- No placeholders like [Phone] or [Email]`;
  },

  interviewPrep: (profile, stories, round) => {
    const tc = tierContext(profile);
    const storyCtx = stories.length > 0
      ? stories.map(s => `"${s.title}": ${s.result}`).join("\n")
      : "No interview stories added yet — prep from resume context.";
    const profileCtx = [
      profile.title && `Title: ${profile.title}`,
      profile.background && `Background: ${profile.background}`,
      profile.resumeText && `Resume context: ${profile.resumeText.slice(0, 600)}`,
    ].filter(Boolean).join("\n");
    return `You are an interview coach preparing ${profile.name || "this candidate"} for a ${round} interview.
${profileCtx}

CANDIDATE LEVEL: ${profile.profileTier || "senior"}
${tc.voice}
${tc.questions}

Stories: ${storyCtx}

Generate:
1. LIKELY QUESTIONS — 8 questions this interviewer will probably ask, calibrated to candidate level and round
2. ANGLE FOR EACH — the specific story or proof point to lead with, and the key message to land
3. TRICKY QUESTIONS — 3 harder questions (gaps, concerns, failures) with suggested honest framings
4. QUESTIONS TO ASK — 4 sharp questions the candidate should ask the interviewer

Be specific to this candidate's background. No generic advice.`;
  },

  storyExtract: (profile) =>
    `You are an expert career coach helping ${profile.name || "this candidate"} build a STAR story library.

Analyze the resume and extract 4-6 significant achievements that would make strong interview stories.

Return ONLY a valid JSON array. Critical rules:
- Straight double quotes only (no curly quotes)
- No em dashes (use hyphen)
- No unescaped apostrophes
- All string values on a single line
- No trailing commas

[{
  "title": "Brief title leading with the outcome or metric",
  "company": "company name",
  "role": "job title at that company",
  "competencies": ["one or two from: Transformation, Financial Impact, Leadership, Technical, Agile/Delivery, Governance, Vendor Management, Strategy, Stakeholder"],
  "hook": "One powerful sentence using proof+potential bridge. Format: [Achieved X], which positions me to [future capability]. Executive voice, no em dashes.",
  "situation": "2-3 sentences describing the context and problem.",
  "task": "1-2 sentences describing what you were responsible for.",
  "action": "2-3 sentences describing what you specifically did.",
  "result": "1-2 sentences with quantified outcomes where possible.",
  "tags": ["keyword1", "keyword2", "keyword3"],
  "starred": false
}]

Return ONLY the JSON array, nothing else.`,

  storyExtractOnboard: (profile) =>
    `You are an expert career coach helping ${profile.name || "this candidate"} build a STAR story library.

Analyze the resume and extract 3-5 significant achievements that would make strong interview stories.
Focus on results with numbers, scope, or clear before/after impact.

Return ONLY a valid JSON array. Critical rules:
- Straight double quotes only
- No em dashes (use hyphen)
- No unescaped apostrophes
- All string values on a single line
- No trailing commas

[{
  "title": "Brief title leading with the outcome or metric",
  "company": "company name",
  "role": "job title at that company",
  "competencies": ["one or two from: Transformation, Financial Impact, Leadership, Technical, Agile/Delivery, Governance, Vendor Management, Strategy, Stakeholder"],
  "hook": "Proof+potential bridge: [Achieved X], which positions me to [future capability]. Executive voice.",
  "situation": "2-3 sentences describing the context and problem.",
  "task": "1-2 sentences describing responsibility.",
  "action": "2-3 sentences describing specific actions taken.",
  "result": "1-2 sentences with quantified outcomes.",
  "tags": ["keyword1","keyword2","keyword3"],
  "starred": false
}]

Return ONLY the JSON array, nothing else.`,

  storyInterview: (profile, story) =>
    `You are a warm, encouraging career coach helping ${profile.name || "this candidate"} build a STAR interview story.

STAR FORMAT:
- Situation: "Tell me about a time when…"
- Task: "What were you responsible for?"
- Action: "Walk me through what you did."
- Result: "What was the outcome?"

HOOK GUIDANCE — when building the hook sentence, guide toward PROOF + POTENTIAL BRIDGE:
Format: "[Achieved X result], which now positions me to [what this experience enables going forward]."
Example: "Surfaced $13M in SaaS rationalization across a 75-initiative portfolio, which positions me to own enterprise-scale vendor governance with direct P&L accountability."
This format works for both the 30-second phone screen opener and resume bullets.

When asking each section, briefly remind the user what interviewers are listening for. Keep it natural.
If the user gives a vague answer, ask for a specific number, timeline, or concrete example.

Current story being built:
${JSON.stringify(story, null, 2)}

Rules:
- Ask ONE focused question at a time
- Be warm, conversational, and encouraging
- When all four STAR fields are reasonably complete, respond with ONLY a JSON object:
{"complete": true, "situation": "...", "task": "...", "action": "...", "result": "...", "hook": "[Achievement], which positions me to [future capability]."}
- Otherwise respond with just your coaching + question as plain text — no JSON`,

  storyMatch: (stories) => {
    const storyList = stories.map((s, i) =>
      `${i}: "${s.title}" [${s.competencies?.join(", ") || ""}] — ${s.result || s.hook || ""}`
    ).join("\n");
    return `You are matching interview stories to a job description.
Stories available:
${storyList}
Return ONLY a JSON array of the 3 most relevant stories — ordered by relevance:
[{"index": <number>, "useFor": "<specific interview question type>", "why": "<one sentence on why this story fits this role>"}]
No preamble. Only the JSON array.`;
  },

  followUp: (profile, card, type) => {
    const tc = tierContext(profile);
    const typeInstructions = {
      "thank-you": `Write a post-interview thank you email. Send within 24 hours. Reference one specific topic discussed. Reaffirm genuine interest and one key proof point. 3 short paragraphs maximum, warm but professional close.`,
      "recruiter-follow-up": `Write a recruiter follow-up email. Polite, brief, not desperate. Reference the specific role and when applied. Express continued strong interest. Ask for a clear next step. 2 paragraphs maximum.`,
      "check-in": `Write a check-in email for a role gone quiet after an interview. Professional, not needy. Acknowledge their timeline. Restate interest and one differentiating value point. 2 tight paragraphs.`,
      "offer-response": `Write an email responding to a job offer. Acknowledge and express genuine enthusiasm. If accepting: confirm start date. If negotiating: professional framing around one ask only. Warm, decisive, forward-looking tone.`,
    };
    return `You are writing a professional email for ${profile.name || "this candidate"}.
${tc.voice}
Role: ${card.title || "this position"} at ${card.company || "this company"}
Stage: ${card.stage || "unknown"}
${typeInstructions[type] || typeInstructions["thank-you"]}
RULES: Subject line on first line prefixed "Subject: ". Blank line. Email body. No placeholders. No closing signature block.`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GLOBAL STATE
// ─────────────────────────────────────────────────────────────────────────────

let _sessionCost = 0;
const _costListeners = new Set();
function trackCost(inChars, outChars) {
  _sessionCost += (inChars / 1_000_000) * 0.25 + (outChars / 1_000_000) * 1.25;
  _costListeners.forEach(cb => cb(_sessionCost));
}
function useSessionCost() {
  const [cost, setCost] = useState(_sessionCost);
  useEffect(() => {
    _costListeners.add(setCost);
    return () => _costListeners.delete(setCost);
  }, []);
  return cost;
}

let _apiLocked = false;
const _lockListeners = new Set();
function setApiLock(v) { _apiLocked = v; _lockListeners.forEach(cb => cb(v)); }
function useApiLock() {
  const [locked, setLocked] = useState(_apiLocked);
  useEffect(() => {
    _lockListeners.add(setLocked);
    return () => _lockListeners.delete(setLocked);
  }, []);
  return locked;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STORAGE
// ─────────────────────────────────────────────────────────────────────────────

function storageGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function getActiveResume(profile) {
  if (!profile.resumeVariants?.length) return profile.resumeText || "";
  const active = profile.resumeVariants.find(v => v.id === profile.activeResumeId)
    || profile.resumeVariants[0];
  return active?.text || "";
}
function getActiveResumeVariant(profile) {
  if (!profile.resumeVariants?.length) {
    return profile.resumeText
      ? { id: "v1", name: "Base Resume", text: profile.resumeText, createdAt: null }
      : null;
  }
  return profile.resumeVariants.find(v => v.id === profile.activeResumeId)
    || profile.resumeVariants[0] || null;
}

const PRE_INTEL_COMPANIES = ["proudcloud", "bookmans", "bookman's"];

function stripPreIntelRoles(text) {
  if (!text) return text;
  const lines = text.split("\n");
  const result = [];
  let skipping = false;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    const lower = t.toLowerCase();
    const isRoleHeader = t.includes("|") && !t.includes("@") && t.split("|").length >= 2 && t.split("|").length <= 4;
    if (isRoleHeader) {
      const isExcluded = PRE_INTEL_COMPANIES.some(c => lower.includes(c));
      skipping = isExcluded;
      if (!skipping) result.push(t);
      continue;
    }
    const isSectionHeader = t === t.toUpperCase() && t.trim().length > 2 && t.trim().length < 40 && !t.includes("|") && !t.includes("@");
    if (isSectionHeader) skipping = false;
    if (!skipping) result.push(t);
  }
  return result.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. API
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
const APIFY_TOKEN       = import.meta.env.VITE_APIFY_TOKEN || "";

async function callClaude(system, user, maxTokens = 2000) {
  if (!ANTHROPIC_API_KEY) throw new Error("API key not configured. Set VITE_ANTHROPIC_API_KEY.");
  setApiLock(true);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || `API ${res.status}`);
    const text = data.content?.find(b => b.type === "text")?.text || "";
    trackCost((system + user).length, text.length);
    return text;
  } finally { setApiLock(false); }
}

async function callClaudeSearch(company, query) {
  if (!ANTHROPIC_API_KEY) throw new Error("API key not configured.");
  setApiLock(true);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: `You are a research analyst preparing a pre-interview briefing about ${company}.
Summarize findings in 3-5 factual sentences with specific numbers, names, and dates.
After your summary, list 1-3 source URLs as: "Sources: url1, url2"
Scope is limited to public information about the company.`,
        messages: [{ role: "user", content: query }],
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || `API ${res.status}`);
    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    trackCost(query.length, (text || "").length);
    return text || "No information found.";
  } finally { setApiLock(false); }
}

async function extractContactFromResume(resumeText) {
  try {
    const text = await callClaude(PROMPTS.contactExtract(), resumeText.slice(0, 3000), 400);
    const m = text.match(/\{[\s\S]*?\}/);
    if (!m) return {};
    return JSON.parse(m[0]);
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GOOGLE DRIVE INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

const DRIVE_FOLDER_NAME = "NarrativeOS";

function getDriveToken(userKey) {
  const legacy = localStorage.getItem("cf:google_token:drive");
  const scoped  = userKey ? localStorage.getItem(`${userKey}:google_token:drive`) : null;
  if (legacy && userKey && !scoped) {
    localStorage.setItem(`${userKey}:google_token:drive`, legacy);
    localStorage.removeItem("cf:google_token:drive");
  }
  return userKey
    ? localStorage.getItem(`${userKey}:google_token:drive`)
    : localStorage.getItem("cf:google_token:drive");
}

async function getOrCreateDriveFolder(token) {
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) return searchData.files[0].id;
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  const folder = await createRes.json();
  return folder.id;
}

async function saveToDrive(blob, filename, token) {
  const folderId = await getOrCreateDriveFolder(token);
  const metadata = { name: filename, parents: [folderId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
  );
  return await res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. DOCX GENERATION
// ─────────────────────────────────────────────────────────────────────────────

let _docxLib = null;
async function getDocxLib() {
  if (!_docxLib) _docxLib = await import("https://esm.sh/docx@8.5.0");
  return _docxLib;
}

async function buildResumeDocxBlob(finalResumeText, company, profile) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType } = await getDocxLib();
  const children = [];
  const lines = stripPreIntelRoles(finalResumeText).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) { children.push(new Paragraph({ text: "", spacing: { after: 40 } })); continue; }
    if (i === 0 || children.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 28, color: "1a1a4a", font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 60 } }));
    } else if (t.includes("|") && t.includes("@") && children.length <= 2) {
      children.push(new Paragraph({ children: [new TextRun({ text: t, size: 18, color: "444444", font: "Calibri" })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }));
    } else if (t === t.toUpperCase() && t.length > 2 && t.length < 40 && !t.includes("|") && !t.includes("@") && !t.includes("—")) {
      children.push(new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 20, color: "1a1a4a", font: "Calibri" })], spacing: { before: 180, after: 60 } }));
    } else if (t.includes("|") && !t.includes("@") && t.split("|").length >= 2 && t.split("|").length <= 4) {
      const parts = t.split("|").map(p => p.trim());
      children.push(new Paragraph({ children: [new TextRun({ text: parts[0], bold: true, size: 19, color: "111111", font: "Calibri" }), new TextRun({ text: "  |  ", size: 19, color: "888888", font: "Calibri" }), new TextRun({ text: parts.slice(1).join("  |  "), size: 19, color: "444444", font: "Calibri" })], spacing: { before: 140, after: 40 } }));
    } else if (t.startsWith("-") || t.startsWith("•")) {
      children.push(new Paragraph({ children: [new TextRun({ text: t.replace(/^[-•]\s*/, ""), size: 19, color: "111111", font: "Calibri" })], bullet: { level: 0 }, spacing: { after: 40 } }));
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: t, size: 19, color: "111111", font: "Calibri" })], spacing: { after: 60 } }));
    }
  }
  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 504, bottom: 504, left: 720, right: 720 } } }, children }],
    styles: { default: { document: { run: { font: "Calibri", size: 19 } } } },
  });
  return await Packer.toBlob(doc);
}

async function buildCoverLetterDocxBlob(letterText, company, role, profile) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await getDocxLib();
  const contactLine = `${profile.address}  |  ${profile.phone}  |  ${profile.email}  |  ${profile.website}`;
  const cleanLines = letterText.split("\n").filter(l => {
    const t = l.trim();
    if (!t) return true;
    if (t.match(/^\[.*\]$/) || t === profile.email || t === profile.phone) return false;
    if (t.toLowerCase().includes(profile.name?.toLowerCase()) && t.length < 30) return false;
    return true;
  });
  const children = [
    new Paragraph({ children: [new TextRun({ text: (profile.name || "").toUpperCase(), bold: true, size: 30, color: "1a1a4a", font: "Calibri" })], spacing: { after: 60 } }),
    new Paragraph({ children: [new TextRun({ text: contactLine, size: 18, color: "555555", font: "Calibri" })], spacing: { after: 80 } }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: "2F2B8F" } }, spacing: { after: 320 } }),
    new Paragraph({ children: [new TextRun({ text: getToday(), size: 20, color: "555555", font: "Calibri" })], spacing: { after: 320 } }),
  ];
  if (company) children.push(new Paragraph({ children: [new TextRun({ text: company, size: 20, bold: true, font: "Calibri" })], spacing: { after: 40 } }));
  if (role) children.push(new Paragraph({ children: [new TextRun({ text: role, size: 20, color: "444444", font: "Calibri" })], spacing: { after: 320 } }));
  let bodyStarted = false;
  for (const line of cleanLines.join("\n").split("\n")) {
    const t = line.trim();
    if (!t && !bodyStarted) continue;
    bodyStarted = true;
    if (!t) { children.push(new Paragraph({ text: "", spacing: { after: 140 } })); continue; }
    children.push(new Paragraph({ children: [new TextRun({ text: t, size: 22, color: "111111", font: "Calibri" })], spacing: { after: 80 }, alignment: AlignmentType.JUSTIFIED }));
  }
  children.push(new Paragraph({ text: "", spacing: { after: 160 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: profile.name || "", size: 22, bold: true, font: "Calibri" })], spacing: { after: 40 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: profile.phone || "", size: 20, color: "555555", font: "Calibri" })], spacing: { after: 40 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: profile.email || "", size: 20, color: "555555", font: "Calibri" })], spacing: { after: 40 } }));
  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } }, children }],
    styles: { default: { document: { run: { font: "Calibri" } } } },
  });
  return await Packer.toBlob(doc);
}

// resumeType flows from ResumeTab → here → resumeRender prompt
async function buildFinalResumeText(baseResume, strategy, jd, resumeType = "chronological") {
  return callClaude(
    PROMPTS.resumeRender(resumeType),
    `Base Resume:\n${stripPreIntelRoles(baseResume)}\n\nApproved Strategy:\n${JSON.stringify(strategy, null, 2)}\n\nJob Description:\n${jd}`,
    2700
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  input: { width: "100%", background: "#1e2240", border: "1px solid #3a3d5c", borderRadius: "6px", padding: "10px 14px", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#e8e4f8", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" },
  textarea: { width: "100%", background: "#1e2240", border: "1px solid #3a3d5c", borderRadius: "6px", padding: "12px 14px", fontSize: "14px", fontFamily: "Georgia, serif", color: "#e8e4f8", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: "1.6" },
  btn: { background: "#4f6ef7", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 20px", fontSize: "14px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: "600", cursor: "pointer", transition: "opacity 0.15s" },
  btnGhost: { background: "transparent", color: "#8880b8", border: "1px solid #3a3d5c", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer" },
  section: { background: "#181a2e", border: "1px solid #2e3050", borderRadius: "10px", padding: "20px 24px" },
  label: { display: "block", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "#4f6ef7", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: "600", marginBottom: "10px" },
  resultBox: { fontSize: "14px", color: "#c8c4e8", fontFamily: "Georgia, serif", lineHeight: "1.8", whiteSpace: "pre-wrap", maxHeight: "480px", overflowY: "auto", padding: "16px", background: "#1a1c2e", borderRadius: "6px", border: "1px solid #2e3050" },
  btnSmall: { background: "#4f6ef7", color: "#fff", border: "none", borderRadius: "5px", padding: "4px 10px", fontSize: "11px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: 600, cursor: "pointer" },
  tab: { padding: "16px 20px" },
};

const _spinStyle = document.createElement("style");
_spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(_spinStyle);

// ─────────────────────────────────────────────────────────────────────────────
// 8. UTILITY COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="#4f6ef7" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      style={{ ...S.btnGhost, fontSize: "12px", padding: "5px 12px" }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function Tag({ label, color = "#3a3d5c", textColor = "#8880a0" }) {
  return <span style={{ background: color, color: textColor, borderRadius: "3px", padding: "2px 8px", fontSize: "11px", fontFamily: "'DM Sans', system-ui, sans-serif", whiteSpace: "nowrap" }}>{label}</span>;
}

function CompBadge({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? "rgba(99,140,255,0.18)" : "rgba(255,255,255,0.03)", color: active ? "#8aacff" : "#5a5870", border: `1px solid ${active ? "#4a6abf" : "#3a3d5c"}`, borderRadius: "4px", padding: "5px 12px", fontSize: "12px", fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer" }}>{label}</button>
  );
}

function generateId() { return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function StagePill({ stage, onClick, small }) {
  const c = STAGE_COLORS[stage] || STAGE_COLORS.Radar;
  return (
    <button onClick={onClick} style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: "12px", padding: small ? "2px 8px" : "4px 12px", fontSize: small ? "11px" : "12px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: "600", cursor: onClick ? "pointer" : "default" }}>
      {stage}
    </button>
  );
}

function SaveToDriveBtn({ blob, filename, onSaved, disabled }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState(null);
  const handle = async () => {
    setSaving(true); setErr(null);
    try {
      const token = await getDriveToken();
      if (!token) { setErr("Connect Google Drive in Profile first"); setSaving(false); return; }
      const result = await saveToDrive(blob, filename, token);
      if (result.webViewLink) { setSaved(true); onSaved?.(result); }
      else setErr("Upload failed");
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };
  if (saved) return <span style={{ fontSize: "12px", color: "#4ade80", fontFamily: "'DM Sans', system-ui, sans-serif" }}>✓ Saved to Drive</span>;
  return (
    <div>
      <button onClick={handle} disabled={disabled || saving} style={{ ...S.btnGhost, fontSize: "12px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", opacity: disabled || saving ? 0.5 : 1 }}>
        {saving ? <><Spinner size={12} />Saving…</> : "📁 Save to Drive"}
      </button>
      {err && <div style={{ fontSize: "11px", color: "#f87171", marginTop: "4px" }}>{err}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. AUTH
// ─────────────────────────────────────────────────────────────────────────────

function useNetlifyAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => {
    const ni = window.netlifyIdentity;
    if (!ni) { setAuthLoading(false); return; }
    const onInit   = (u) => { setUser(u); setAuthLoading(false); };
    const onLogin  = (u) => { setUser(u); setAuthLoading(false); ni.close(); };
    const onLogout = ()  => { setUser(null); setAuthLoading(false); };
    ni.on("init", onInit); ni.on("login", onLogin); ni.on("logout", onLogout);
    if (ni.currentUser) { setUser(ni.currentUser()); setAuthLoading(false); }
    const timeout = setTimeout(() => setAuthLoading(false), 4000);
    return () => { ni.off("init", onInit); ni.off("login", onLogin); ni.off("logout", onLogout); clearTimeout(timeout); };
  }, []);
  const login  = () => window.netlifyIdentity?.open("login");
  const logout = () => window.netlifyIdentity?.logout();
  return { user, authLoading, login, logout };
}

function LoginGate() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#e8e4f8", fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "-1px", marginBottom: "8px" }}>NarrativeOS</div>
          <div style={{ fontSize: "14px", color: "#c8c4e8", fontFamily: "'DM Sans', system-ui, sans-serif", fontStyle: "italic" }}>Your story. Your signal.</div>
        </div>
        <div style={{ background: "#181a2e", border: "1px solid #2e3050", borderRadius: "16px", padding: "40px", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#e8e4f8", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: "8px" }}>Sign in to continue</div>
          <div style={{ fontSize: "14px", color: "#6860a0", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: "1.6", marginBottom: "32px" }}>Your profile, stories, and applications are private to your account.</div>
          <button onClick={() => window.netlifyIdentity?.open("login")} style={{ width: "100%", background: "#ffffff", color: "#1a1a2e", border: "none", borderRadius: "8px", padding: "13px 20px", fontSize: "15px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>
          <button onClick={() => window.netlifyIdentity?.open("login")} style={{ width: "100%", background: "transparent", color: "#a8a0c8", border: "1px solid #2e3050", borderRadius: "8px", padding: "13px 20px", fontSize: "15px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: "500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            ✉ Continue with email
          </button>
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// 12. JD ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

function JDInput({ jd, setJd }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={S.label}>Job Description</label>
      <textarea value={jd} onChange={e => setJd(e.target.value)} rows={8} placeholder="Paste the full job description here…" style={S.textarea} onFocus={e => e.target.style.borderColor = "#4a4abf"} onBlur={e => e.target.style.borderColor = "#3a3d5c"} />
    </div>
  );
}

function AnalysisModal({ score, rationale, gaps, onBuildResume, onResumeOnly, onCorrect, onNewJD, onDismiss }) {
  const verdict =
    score >= 8 ? { label: "Excellent Match! 🎯", color: "#4ade80", rec: "This role was made for you. Your background aligns strongly.", cta: "Build tailored resume + cover letter" } :
    score >= 6 ? { label: "Strong Contender ✅", color: "#fbbf24", rec: "You have the core experience. Let's sharpen your materials.", cta: "Build tailored resume + cover letter" } :
    score >= 4 ? { label: "Possible Fit 🤔", color: "#fb923c", rec: "There are gaps here, but your background has transferable strengths.", cta: "Build tailored resume anyway" } :
                 { label: "Tough Road Ahead 💪", color: "#f87171", rec: "Significant gaps. Check if the AI missed anything before deciding.", cta: "Apply with base resume" };
  return (
    <div onClick={onDismiss} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#181a2e", border: `1px solid rgba(100,100,200,0.25)`, borderRadius: "14px", width: "100%", maxWidth: "620px", maxHeight: "88vh", overflowY: "auto", padding: "36px", boxShadow: "0 24px 80px rgba(0,0,0,0.7)", position: "relative" }}>
        <button onClick={onDismiss} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "#a0a0c0", fontSize: "16px" }}>✕</button>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "80px", fontWeight: "800", lineHeight: 1, color: verdict.color, fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: "-2px" }}>{score}<span style={{ fontSize: "32px", color: "#6060a0", fontWeight: "400" }}>/10</span></div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: verdict.color, fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: "10px" }}>{verdict.label}</div>
          <div style={{ fontSize: "15px", color: "#c8c4e8", fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: "12px", lineHeight: "1.65", maxWidth: "480px", margin: "12px auto 0" }}>{verdict.rec}</div>
          <div style={{ fontSize: "13px", color: "#7870a0", fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: "8px", fontStyle: "italic" }}>{rationale}</div>
        </div>
        {gaps.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#8880b8", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: "600", marginBottom: "12px" }}>Gaps to Review ({gaps.length})</div>
            {gaps.map((gap, i) => (
              <div key={i} style={{ background: "#1e2035", border: "1px solid #2e3050", borderRadius: "8px", padding: "12px 16px", marginBottom: "8px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#e8e4f8", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: "4px" }}>{gap.title}</div>
                <div style={{ fontSize: "13px", color: "#9890b8", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: "1.6" }}>{gap.assessment}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={onBuildResume} style={{ background: "#4f6ef7", color: "#ffffff", border: "none", borderRadius: "8px", padding: "15px 20px", fontSize: "15px", fontWeight: "600", fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{verdict.cta}</span><span style={{ fontSize: "13px", opacity: 0.8 }}>→ Resume tab</span>
          </button>
          <button onClick={onResumeOnly} style={{ background: "rgba(160,140,220,0.12)", color: "#e8e4f8", border: "1px solid rgba(160,140,220,0.3)", borderRadius: "8px", padding: "13px 20px", fontSize: "13px", fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer" }}>
            Apply with source-of-truth resume — no tailoring
          </button>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button onClick={onCorrect} style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "8px", padding: "11px 16px", fontSize: "13px", fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", flex: 1 }}>Correct a gap → re-score</button>
            <button onClick={onNewJD} style={{ background: "rgba(74,222,128,0.08)", color: "#6ab8a8", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "8px", padding: "11px 16px", fontSize: "13px", fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer", flex: 1 }}>Try a different role</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GapCorrectionPanel({ gaps, corrections, onSave, onDone }) {
  const [local, setLocal] = useState(gaps.map(g => ({ ...g, flagged: false, userCorrection: corrections[g.title] || "" })));
  const toggle = i => setLocal(p => p.map((g, idx) => idx === i ? { ...g, flagged: !g.flagged } : g));
  const update = (i, v) => setLocal(p => p.map((g, idx) => idx === i ? { ...g, userCorrection: v } : g));
  const handleSave = () => {
    const updated = {};
    local.forEach(g => { if (g.flagged && g.userCorrection.trim()) updated[g.title] = g.userCorrection.trim(); });
    onSave(updated);
  };
  return (
    <div style={{ background: "#1e2035", border: "1px solid #2a2a3a", borderRadius: "8px", padding: "24px", marginBottom: "24px" }}>
      <div style={{ fontSize: "14px", fontWeight: "600", color: "#e0dcf4", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: "4px" }}>Correct the Gaps</div>
      <div style={{ fontSize: "12px", color: "#8880b8", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: "16px" }}>Flag any gap the AI got wrong and explain why.</div>
      {local.map((gap, i) => (
        <div key={i} style={{ border: `1px solid ${gap.flagged ? "rgba(201,168,76,0.4)" : "#2e3050"}`, borderRadius: "6px", padding: "14px 16px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <button onClick={() => toggle(i)} style={{ background: gap.flagged ? "#c9a84c" : "transparent", border: `1px solid ${gap.flagged ? "#c9a84c" : "#6860a0"}`, borderRadius: "3px", width: "18px", height: "18px", cursor: "pointer", flexShrink: 0, marginTop: "2px", fontSize: "11px", color: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>{gap.flagged ? "✓" : ""}</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#c0b0d8", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: "3px" }}>{gap.title}</div>
              <div style={{ fontSize: "12px", color: "#4a4060", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: "1.5" }}>{gap.assessment}</div>
              {gap.flagged && (
                <div style={{ marginTop: "10px" }}>
                  <textarea value={gap.userCorrection} onChange={e => update(i, e.target.value)} placeholder="Explain why this is not actually a gap…" rows={3} style={{ ...S.textarea, border: "1px solid #c9a84c" }} />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <button onClick={handleSave} style={{ background: "#c9a84c", color: "#0f1117", border: "none", borderRadius: "4px", padding: "10px 24px", fontSize: "13px", fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: "600", cursor: "pointer" }}>Save Corrections</button>
        <button onClick={onDone} style={S.btnGhost}>Done</button>
      </div>
    </div>
  );
}

// AnalyzeTab — returns { company, role } via onBuildResume/onResumeOnly/onAddToTracker for card auto-population
function AnalyzeTab({ jd, setJd, stories, corrections, onSaveCorrections, onBuildResume, onResumeOnly, onNewJD, profile, onAddToTracker }) {
  const [parsedScore, setParsedScore]         = useState(null);
  const [parsedRationale, setParsedRationale] = useState("");
  const [parsedGaps, setParsedGaps]           = useState([]);
  const [parsedCompany, setParsedCompany]     = useState("");
  const [parsedRole, setParsedRole]           = useState("");
  const [fullResult, setFullResult]           = useState("");
  const [loading, setLoading]                 = useState(false);
  const [reScoring, setReScoring]             = useState(false);
  const [error, setError]                     = useState(null);
  const [showModal, setShowModal]             = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);
  const [showFull, setShowFull]               = useState(false);
  const apiLocked = useApiLock();

  const formatFull = (p) => [
    `FIT SCORE: ${p.score}/10\n${p.rationale}\n`,
    `KEY REQUIREMENTS:\n${p.keyRequirements?.map(r => `• ${r}`).join("\n") || ""}\n`,
    `STRONGEST ANGLES:\n${p.strongestAngles?.map(a => `• ${a.angle}\n  → ${a.why}`).join("\n") || ""}\n`,
    `TOP STORIES:\n${p.topStories?.map(s => `• "${s.story}"\n  → ${s.useFor}`).join("\n") || ""}\n`,
    p.gaps?.length ? `GAPS:\n${p.gaps.map(g => `• ${g.title}\n  ${g.assessment}\n  Framing: ${g.framing}`).join("\n\n")}\n` : "GAPS: None identified.\n",
    `KEYWORDS: ${p.keywords?.join(", ") || ""}`,
  ].join("\n");

  const runWithCorrections = async (activeCorrections) => {
    if (!jd.trim()) return;
    const storyList = stories.length > 0 ? stories.map((s, i) => `${i + 1}. "${s.title}" — ${s.competencies.join(", ")} | Result: ${s.result}`).join("\n") : "";
    const userCtx = stories.length > 0 ? `INTERVIEW STORIES:\n${storyList}\n\n` : "";
    const text = await callClaude(PROMPTS.jdAnalyzer(profile, stories, activeCorrections), `${userCtx}Job Description:\n${jd}`, 3000);
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Could not parse analysis response");
    const p = JSON.parse(m[0]);
    setParsedScore(p.score); setParsedRationale(p.rationale); setParsedGaps(p.gaps || []);
    setParsedCompany(p.company || ""); setParsedRole(p.role || "");
    setFullResult(formatFull(p));
    return p;
  };

  const run = async () => {
    setLoading(true); setError(null); setShowFull(false); setShowModal(false);
    try { await runWithCorrections(corrections); setShowModal(true); }
    catch (e) { setError(`Analysis failed: ${e.message}`); }
    finally { setLoading(false); }
  };

  const handleSaveCorrections = async (nc) => {
    const merged = { ...corrections, ...nc };
    onSaveCorrections(merged); setShowCorrections(false); setReScoring(true);
    try { await runWithCorrections(merged); setShowModal(true); }
    catch (e) { setError(`Re-scoring failed: ${e.message}`); }
    finally { setReScoring(false); }
  };

  const payload = () => ({ company: parsedCompany, role: parsedRole });

  return (
    <div>
      {showModal && (
        <AnalysisModal score={parsedScore} rationale={parsedRationale} gaps={parsedGaps}
          onBuildResume={() => { setShowModal(false); setShowFull(true); onBuildResume(payload()); }}
          onResumeOnly={() => { setShowModal(false); onResumeOnly(payload()); }}
          onCorrect={() => { setShowModal(false); setShowCorrections(true); }}
          onNewJD={() => { setShowModal(false); onNewJD(); }}
          onDismiss={() => setShowModal(false)}
        />
      )}

      {!showModal && parsedScore !== null && !showCorrections && (
        <div onClick={() => setShowModal(true)} style={{ background: parsedScore >= 8 ? "rgba(74,222,128,0.08)" : parsedScore >= 6 ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)", border: "1px solid rgba(100,100,200,0.25)", borderRadius: "8px", padding: "12px 18px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "26px", fontWeight: "800", color: parsedScore >= 8 ? "#4ade80" : parsedScore >= 6 ? "#fbbf24" : "#f87171", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{parsedScore}/10</span>
            <span style={{ fontSize: "14px", color: "#c8c4e8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{parsedRationale}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {onAddToTracker && (
              <button onClick={e => { e.stopPropagation(); onAddToTracker(payload()); }} style={{ ...S.btn, fontSize: "11px", padding: "5px 12px", background: "rgba(79,110,247,0.2)", color: "#8aacff", border: "1px solid #4f6ef7" }}>＋ Add to Tracker</button>
            )}
            <span style={{ fontSize: "12px", color: "#8880b8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>View details →</span>
          </div>
        </div>
      )}

      {reScoring && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#181a2e", borderRadius: "10px", padding: "32px 40px", textAlign: "center", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <div style={{ marginBottom: "16px" }}><Spinner size={24} /></div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#e8e4f8" }}>Re-scoring with corrections…</div>
          </div>
        </div>
      )}

      <JDInput jd={jd} setJd={setJd} />
      {Object.keys(corrections).length > 0 && (
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "4px", padding: "10px 14px", marginBottom: "16px", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: "12px", color: "#8a7040", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ {Object.keys(corrections).length} gap correction{Object.keys(corrections).length > 1 ? "s" : ""} active</span>
          <button onClick={() => setShowCorrections(true)} style={{ background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontSize: "12px" }}>View / edit</button>
        </div>
      )}

      <button onClick={run} disabled={!jd.trim() || loading || reScoring || apiLocked}
        style={{ ...S.btn, opacity: !jd.trim() || loading || reScoring || apiLocked ? 0.5 : 1, display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        {loading ? <><Spinner /> Analyzing…</> : reScoring ? <><Spinner /> Re-scoring…</> : "Run Gap Analysis"}
      </button>
      {error && <div style={{ color: "#c06060", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
      {showCorrections && parsedGaps.length > 0 && <GapCorrectionPanel gaps={parsedGaps} corrections={corrections} onSave={handleSaveCorrections} onDone={() => setShowCorrections(false)} />}
      {showFull && fullResult && (
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ ...S.label, margin: 0 }}>Full Analysis</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <CopyBtn text={fullResult} />
              {parsedGaps.length > 0 && <button onClick={() => setShowCorrections(!showCorrections)} style={{ ...S.btnGhost, fontSize: "11px", padding: "5px 12px", color: "#c9a84c" }}>Correct gaps</button>}
            </div>
          </div>
          <div style={S.resultBox}>{fullResult}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOARD COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function RoleCard({ card, onClick, onStageChange }) {
  const sc = STAGE_COLORS[card.stage] || STAGE_COLORS.Radar;
  return (
    <div onClick={() => onClick(card)} style={{ background: "rgba(20,20,35,0.7)", border: `1px solid ${sc.border}`, borderRadius: "8px", padding: "14px 16px", marginBottom: "10px", cursor: "pointer", transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#e8e6f0", lineHeight: 1.3, flex: 1, paddingRight: "8px" }}>{card.company || "New Role"}</div>
        <StagePill stage={card.stage} small onClick={e => { e.stopPropagation(); }} />
      </div>
      <div style={{ fontSize: "12px", color: "#8a85a0", marginBottom: "8px" }}>{card.title || "Title TBD"}</div>
      {card.tags && card.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {card.tags.slice(0, 3).map(t => <Tag key={t} label={t} />)}
        </div>
      )}
    </div>
  );
}

function Board({ cards, onCardClick, onAddCard }) {
  const grouped = STAGES.reduce((acc, s) => { acc[s] = cards.filter(c => c.stage === s); return acc; }, {});
  return (
    <div style={{ overflowX: "auto", paddingBottom: "16px" }}>
      <div style={{ display: "flex", gap: "12px", minWidth: `${STAGES.length * 200}px` }}>
        {STAGES.map(stage => {
          const sc = STAGE_COLORS[stage];
          return (
            <div key={stage} style={{ flex: "0 0 190px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: sc.text, letterSpacing: "0.08em", textTransform: "uppercase" }}>{stage}</span>
                <span style={{ fontSize: "11px", color: "#4a4860", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "1px 7px" }}>{grouped[stage].length}</span>
              </div>
              {grouped[stage].map(card => <RoleCard key={card.id} card={card} onClick={onCardClick} />)}
              {stage === "Radar" && (
                <button onClick={onAddCard} style={{ width: "100%", background: "rgba(99,140,255,0.06)", border: "1px dashed #3a3d6a", borderRadius: "8px", padding: "10px", color: "#6060a0", fontSize: "12px", cursor: "pointer" }}>+ Add Role</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB SEARCH TAB
// ─────────────────────────────────────────────────────────────────────────────

async function scoreJobsAgainstProfile(jobs, profile) {
  if (!jobs.length || !profile.resumeText) return jobs.map(j => ({ ...j, fitScore: null }));
  const resumeSnip = getActiveResume(profile).slice(0, 800);
  const list = jobs.map((j, i) => `${i}. ${j.title} at ${j.company}: ${(j.snippet || "").slice(0, 150)}`).join("\n");
  const sys = `You score job fit for a senior transformation executive. Resume snippet: ${resumeSnip}`;
  const user = `Score each job 0-100 for fit. Return JSON array of numbers only, same order.\n${list}`;
  try {
    const raw = await callClaude(sys, user, 300);
    const scores = JSON.parse(raw.match(/\[.*\]/s)?.[0] || "[]");
    return jobs.map((j, i) => ({ ...j, fitScore: scores[i] ?? null }));
  } catch { return jobs.map(j => ({ ...j, fitScore: null })); }
}

function JobResultCard({ job, onAnalyze, onAddToTracker }) {
  const score = job.fitScore;
  const scoreColor = score >= 75 ? "#4ade80" : score >= 50 ? "#fbbf24" : score !== null ? "#f87171" : "#4a4860";
  return (
    <div style={{ background: "rgba(20,20,35,0.7)", border: "1px solid #2a2840", borderRadius: "8px", padding: "14px 16px", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#e8e6f0" }}>{job.title}</div>
          <div style={{ fontSize: "12px", color: "#8a85a0", marginTop: "2px" }}>{job.company}{job.location ? ` · ${job.location}` : ""}</div>
        </div>
        {score !== null && (
          <div style={{ fontSize: "12px", fontWeight: 700, color: scoreColor, background: `${scoreColor}18`, border: `1px solid ${scoreColor}40`, borderRadius: "6px", padding: "3px 8px", flexShrink: 0 }}>{score}%</div>
        )}
      </div>
      {job.snippet && <div style={{ fontSize: "12px", color: "#6a6880", marginBottom: "10px", lineHeight: 1.5 }}>{job.snippet.slice(0, 180)}…</div>}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => onAnalyze(job)} style={{ ...S.btnSmall }}>Analyze Fit</button>
        <button onClick={() => onAddToTracker(job)} style={{ ...S.btnGhost, fontSize: "11px", padding: "4px 10px" }}>+ Tracker</button>
        {job.url && <a href={job.url} target="_blank" rel="noreferrer" title="Opens job posting — paste the JD into Analyze Fit for full analysis" style={{ ...S.btnGhost, fontSize: "11px", padding: "4px 10px", textDecoration: "none" }}>View ↗</a>}
      </div>
    </div>
  );
}

function JobSearchTab({ profile, onAnalyzeJob, onAddToTracker }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Remote");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scored, setScored] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (!query.trim()) return;
    setLoading(true); setError(""); setJobs([]); setScored(false);
    try {
      const results = await callClaudeSearch(`${query} ${location}`, `Find 8 real job postings for: ${query} in ${location}. Return JSON array with fields: title, company, location, snippet, url.`);
      let parsed = [];
      try { parsed = JSON.parse(results.match(/\[.*\]/s)?.[0] || "[]"); } catch {}
      const withScores = await scoreJobsAgainstProfile(parsed, profile);
      setJobs(withScores); setScored(true);
    } catch (e) { setError("Search failed. Check API key or try again."); }
    setLoading(false);
  }

  return (
    <div style={S.tab}>
      <div style={S.label}>Job Search</div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Role title or keywords…" style={{ ...S.input, flex: 2, minWidth: "160px" }} />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" style={{ ...S.input, flex: 1, minWidth: "100px" }} />
        <button onClick={search} disabled={loading || !query.trim()} style={{ ...S.btn, opacity: loading || !query.trim() ? 0.5 : 1 }}>
          {loading ? <><Spinner /> Searching…</> : "Search"}
        </button>
      </div>
      {error && <div style={{ color: "#c06060", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
      {jobs.length > 0 && (
        <>
          <div style={{ fontSize: "12px", color: "#4a4860", marginBottom: "12px" }}>{jobs.length} results{scored && profile.resumeText ? " · scored against your profile" : ""}</div>
          {jobs.map((job, i) => <JobResultCard key={i} job={job} onAnalyze={onAnalyzeJob} onAddToTracker={onAddToTracker} />)}
        </>
      )}
      {!loading && jobs.length === 0 && !error && (
        <div style={{ textAlign: "center", color: "#3a3860", fontSize: "13px", paddingTop: "40px" }}>Search for roles above to see AI-scored results.</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUME TAB
// ─────────────────────────────────────────────────────────────────────────────

function ResumeTab({ profile, card, jd }) {
  const [resumeType, setResumeType] = useState("chronological");
  const [strategy, setStrategy] = useState("");
  const [finalResume, setFinalResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const [blob, setBlob] = useState(null);
  const [saved, setSaved] = useState(false);

  const baseResume = getActiveResume(profile);
  const company = card?.company || "";
  const role = card?.title || "";
  const driveToken = getDriveToken(profile.email);

  async function run() {
    if (!baseResume) { setError("Upload a resume in Profile first."); return; }
    setLoading(true); setError(""); setStrategy(""); setFinalResume(""); setBlob(null);
    try {
      setPhase("Building strategy…");
      const strat = await callClaude(
        PROMPTS.resumeStrategy(profile, resumeType),
        `JD:\n${jd || "(none provided)"}\n\nBase resume:\n${baseResume}`,
        1200
      );
      setStrategy(strat);
      setPhase("Rendering resume…");
      const final = await buildFinalResumeText(baseResume, strat, jd, resumeType);
      setFinalResume(final);
      setPhase("Building DOCX…");
      const b = await buildResumeDocxBlob(final, company, profile);
      setBlob(b);
    } catch (e) { setError(String(e)); }
    setLoading(false); setPhase("");
  }

  return (
    <div style={S.tab}>
      <div style={S.label}>Resume Format</div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {RESUME_TYPES.map(rt => (
          <button key={rt.id} onClick={() => setResumeType(rt.id)} style={{
            padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid",
            borderColor: resumeType === rt.id ? "#c9a84c" : "#2a2840",
            background: resumeType === rt.id ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)",
            color: resumeType === rt.id ? "#c9a84c" : "#6a6880",
          }}>
            {rt.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: "12px", color: "#6a6880", marginBottom: "20px", lineHeight: 1.5, padding: "10px 14px", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "6px" }}>
        {RESUME_TYPES.find(r => r.id === resumeType)?.desc}
      </div>

      {company && <div style={{ fontSize: "12px", color: "#4a4860", marginBottom: "12px" }}>Target: <span style={{ color: "#8a85a0" }}>{role} @ {company}</span></div>}

      <button onClick={run} disabled={loading || !baseResume} style={{ ...S.btn, marginBottom: "20px", opacity: loading || !baseResume ? 0.5 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
        {loading ? <><Spinner /> {phase}</> : `Build ${RESUME_TYPES.find(r => r.id === resumeType)?.label} Resume`}
      </button>

      {error && <div style={{ color: "#c06060", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}

      {strategy && (
        <div style={{ ...S.section, marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={S.label}>Strategy</div>
            <CopyBtn text={strategy} />
          </div>
          <div style={{ ...S.resultBox, maxHeight: "200px", overflowY: "auto" }}>{strategy}</div>
        </div>
      )}

      {finalResume && (
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={S.label}>Final Resume</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <CopyBtn text={finalResume} />
              {blob && <SaveToDriveBtn blob={blob} filename={`Resume_${company || "Draft"}_${resumeType}.docx`} onSaved={() => setSaved(true)} disabled={!driveToken} />}
              {blob && (
                <button onClick={() => { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `Resume_${company || "Draft"}_${resumeType}.docx`; a.click(); }} style={S.btnGhost}>↓ DOCX</button>
              )}
            </div>
          </div>
          <div style={S.resultBox}>{finalResume}</div>
          {saved && <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "8px" }}>✓ Saved to Google Drive</div>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER LETTER TAB
// ─────────────────────────────────────────────────────────────────────────────

function CoverLetterTab({ profile, card, jd }) {
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blob, setBlob] = useState(null);

  const company = card?.company || "";
  const role = card?.title || "";
  const driveToken = getDriveToken(profile.email);

  async function run() {
    const base = getActiveResume(profile);
    if (!base) { setError("Upload a resume in Profile first."); return; }
    setLoading(true); setError(""); setLetter(""); setBlob(null);
    try {
      const result = await callClaude(
        PROMPTS.coverLetter(profile, company, role, jd || ""),
        `Base resume:\n${base}\n\nJD:\n${jd || "(none provided)"}`,
        1000
      );
      setLetter(result);
      const b = await buildCoverLetterDocxBlob(result, company, role, profile);
      setBlob(b);
    } catch (e) { setError(String(e)); }
    setLoading(false);
  }

  return (
    <div style={S.tab}>
      <div style={S.label}>Cover Letter</div>
      {company && <div style={{ fontSize: "12px", color: "#4a4860", marginBottom: "12px" }}>Target: <span style={{ color: "#8a85a0" }}>{role} @ {company}</span></div>}
      <div style={{ fontSize: "12px", color: "#6a6880", marginBottom: "16px", lineHeight: 1.5 }}>
        High commitment signal — this cover letter frames this role as the destination, not a stepping stone.
      </div>
      <button onClick={run} disabled={loading} style={{ ...S.btn, marginBottom: "20px", opacity: loading ? 0.5 : 1, display: "flex", gap: "8px", alignItems: "center" }}>
        {loading ? <><Spinner /> Writing…</> : "Generate Cover Letter"}
      </button>
      {error && <div style={{ color: "#c06060", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
      {letter && (
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={S.label}>Cover Letter</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <CopyBtn text={letter} />
              {blob && <SaveToDriveBtn blob={blob} filename={`CoverLetter_${company || "Draft"}.docx`} onSaved={() => {}} disabled={!driveToken} />}
              {blob && (
                <button onClick={() => { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `CoverLetter_${company || "Draft"}.docx`; a.click(); }} style={S.btnGhost}>↓ DOCX</button>
              )}
            </div>
          </div>
          <div style={S.resultBox}>{letter}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW PREP TAB
// ─────────────────────────────────────────────────────────────────────────────

function InterviewPrepTab({ profile, card, jd, stories }) {
  const [questions, setQuestions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [depth, setDepth] = useState("recruiter");

  const company = card?.company || "";
  const role = card?.title || "";

  async function run() {
    const base = getActiveResume(profile);
    if (!base && !jd) { setError("Add a resume or JD first."); return; }
    setLoading(true); setError(""); setQuestions("");
    const tc = tierContext(profile);
    const sys = `${PROMPTS.storyInterview}\n\nTIER CONTEXT:\n${tc.voice}\n${tc.questions}`;
    const user = `Company: ${company}\nRole: ${role}\nDepth: ${depth}\nJD:\n${jd || "(none)"}\nResume:\n${(base || "").slice(0, 1200)}\nStory bank:\n${stories.map(s => s.hook + " — " + s.situation).join("\n").slice(0, 600)}`;
    try {
      const r = await callClaude(sys, user, 1800);
      setQuestions(r);
    } catch (e) { setError(String(e)); }
    setLoading(false);
  }

  return (
    <div style={S.tab}>
      <div style={S.label}>Interview Prep</div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {[["recruiter", "Recruiter Screen"], ["behavioral", "Behavioral"], ["technical", "Technical/Deep"], ["executive", "Executive"]].map(([v, l]) => (
          <button key={v} onClick={() => setDepth(v)} style={{ padding: "6px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", border: "1px solid", borderColor: depth === v ? "#c9a84c" : "#2a2840", background: depth === v ? "rgba(201,168,76,0.1)" : "transparent", color: depth === v ? "#c9a84c" : "#6a6880" }}>{l}</button>
        ))}
      </div>
      {company && <div style={{ fontSize: "12px", color: "#4a4860", marginBottom: "12px" }}>Target: <span style={{ color: "#8a85a0" }}>{role} @ {company}</span></div>}
      <button onClick={run} disabled={loading} style={{ ...S.btn, marginBottom: "20px", opacity: loading ? 0.5 : 1, display: "flex", gap: "8px", alignItems: "center" }}>
        {loading ? <><Spinner /> Building prep…</> : "Generate Interview Prep"}
      </button>
      {error && <div style={{ color: "#c06060", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
      {questions && (
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={S.label}>Prep Document</div>
            <CopyBtn text={questions} />
          </div>
          <div style={{ ...S.resultBox, whiteSpace: "pre-wrap" }}>{questions}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESEARCH TAB
// ─────────────────────────────────────────────────────────────────────────────

function ResearchTab({ profile, card }) {
  const company = card?.company || "";
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState("");

  async function runStep(step) {
    if (!company) { setError("No company set on this role card."); return; }
    setLoading(p => ({ ...p, [step.key]: true })); setError("");
    try {
      const r = await callClaudeSearch(company, step.query(company));
      setResults(p => ({ ...p, [step.key]: r }));
    } catch (e) { setError(String(e)); }
    setLoading(p => ({ ...p, [step.key]: false }));
  }

  async function runAll() {
    for (const step of RESEARCH_STEPS) { await runStep(step); }
  }

  const allSteps = [...RESEARCH_STEPS, ...OPTIONAL_STEPS];

  return (
    <div style={S.tab}>
      <div style={S.label}>Company Research</div>
      {!company ? (
        <div style={{ color: "#4a4860", fontSize: "13px" }}>Set a company name on the role card first.</div>
      ) : (
        <>
          <div style={{ fontSize: "13px", color: "#8a85a0", marginBottom: "16px" }}>Researching: <strong style={{ color: "#c9a84c" }}>{company}</strong></div>
          <button onClick={runAll} disabled={Object.values(loading).some(Boolean)} style={{ ...S.btn, marginBottom: "20px", opacity: Object.values(loading).some(Boolean) ? 0.5 : 1 }}>
            Run All Core Research
          </button>
          {error && <div style={{ color: "#c06060", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
          {allSteps.map(step => (
            <div key={step.key} style={{ ...S.section, marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#8a85a0" }}>{step.label}</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {results[step.key] && <CopyBtn text={results[step.key]} />}
                  <button onClick={() => runStep(step)} disabled={loading[step.key]} style={{ ...S.btnGhost, fontSize: "11px", padding: "4px 10px", opacity: loading[step.key] ? 0.5 : 1 }}>
                    {loading[step.key] ? <Spinner size={12} /> : results[step.key] ? "Refresh" : "Run"}
                  </button>
                </div>
              </div>
              {results[step.key] && <div style={{ ...S.resultBox, fontSize: "12px" }}>{results[step.key]}</div>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────────────────────

function StoryCard({ story, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background: "rgba(20,20,35,0.7)", border: "1px solid #2a2840", borderRadius: "8px", padding: "14px 16px", marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ fontWeight: 600, fontSize: "13px", color: "#e8e6f0", marginBottom: "4px" }}>{story.hook || "Untitled story"}</div>
          <div style={{ fontSize: "11px", color: "#4a4860" }}>{story.tags?.join(" · ")}</div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => onEdit(story)} style={{ ...S.btnGhost, fontSize: "11px", padding: "3px 8px" }}>Edit</button>
          <button onClick={() => onDelete(story.id)} style={{ ...S.btnGhost, fontSize: "11px", padding: "3px 8px", color: "#8a4040" }}>✕</button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #2a2840" }}>
          {story.situation && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "10px", color: "#4a4860", textTransform: "uppercase" }}>Situation</span><div style={{ fontSize: "12px", color: "#8a85a0", marginTop: "4px" }}>{story.situation}</div></div>}
          {story.task && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "10px", color: "#4a4860", textTransform: "uppercase" }}>Task</span><div style={{ fontSize: "12px", color: "#8a85a0", marginTop: "4px" }}>{story.task}</div></div>}
          {story.action && <div style={{ marginBottom: "8px" }}><span style={{ fontSize: "10px", color: "#4a4860", textTransform: "uppercase" }}>Action</span><div style={{ fontSize: "12px", color: "#8a85a0", marginTop: "4px" }}>{story.action}</div></div>}
          {story.result && <div><span style={{ fontSize: "10px", color: "#4a4860", textTransform: "uppercase" }}>Result</span><div style={{ fontSize: "12px", color: "#8a85a0", marginTop: "4px" }}>{story.result}</div></div>}
        </div>
      )}
    </div>
  );
}

function StoryEditor({ story, onSave, onCancel }) {
  const [form, setForm] = useState(story || { id: generateId(), hook: "", situation: "", task: "", action: "", result: "", tags: [] });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <div style={{ ...S.section, padding: "16px" }}>
      <div style={{ ...S.label, marginBottom: "14px" }}>{story ? "Edit Story" : "New Story"}</div>
      {["hook", "situation", "task", "action", "result"].map(k => (
        <div key={k} style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#4a4860", textTransform: "uppercase", marginBottom: "4px" }}>{k === "hook" ? "Hook (proof+potential bridge)" : k}</div>
          <textarea value={form[k]} onChange={set(k)} rows={k === "hook" ? 2 : 3} style={{ ...S.input, width: "100%", resize: "vertical" }} placeholder={k === "hook" ? "[Achieved X], which positions me to [future capability]" : ""} />
        </div>
      ))}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => onSave(form)} style={S.btn}>Save</button>
        <button onClick={onCancel} style={S.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

function MyStoriesTab({ profile, stories, setStories }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [extracting, setExtracting] = useState(false);

  function save(story) {
    setStories(prev => prev.find(s => s.id === story.id) ? prev.map(s => s.id === story.id ? story : s) : [...prev, story]);
    setEditing(null); setAdding(false);
  }

  function remove(id) { setStories(prev => prev.filter(s => s.id !== id)); }

  async function extract() {
    const base = getActiveResume(profile);
    if (!base) return;
    setExtracting(true);
    try {
      const raw = await callClaude(PROMPTS.storyExtract, `Resume:\n${base}`, 2000);
      let parsed = [];
      try { parsed = JSON.parse(raw.match(/\[.*\]/s)?.[0] || "[]"); } catch {}
      const newStories = parsed.map(s => ({ ...s, id: s.id || generateId() }));
      setStories(prev => [...prev, ...newStories]);
    } catch {}
    setExtracting(false);
  }

  return (
    <div style={S.tab}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={S.label}>My Stories</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={extract} disabled={extracting} style={{ ...S.btnGhost, fontSize: "11px", opacity: extracting ? 0.5 : 1 }}>
            {extracting ? <><Spinner size={11} /> Extracting…</> : "Extract from Resume"}
          </button>
          <button onClick={() => setAdding(true)} style={{ ...S.btn, fontSize: "11px", padding: "5px 12px" }}>+ New</button>
        </div>
      </div>
      {adding && <StoryEditor onSave={save} onCancel={() => setAdding(false)} />}
      {editing && <StoryEditor story={editing} onSave={save} onCancel={() => setEditing(null)} />}
      {stories.length === 0 && !adding && (
        <div style={{ textAlign: "center", color: "#3a3860", fontSize: "13px", paddingTop: "30px" }}>No stories yet. Extract from your resume or add manually.</div>
      )}
      {stories.filter(s => s.id !== editing?.id).map(s => <StoryCard key={s.id} story={s} onEdit={setEditing} onDelete={remove} />)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE & ONBOARDING
// ─────────────────────────────────────────────────────────────────────────────

function ResumeVariantManager({ profile, setProfile }) {
  const [name, setName] = useState("");

  function addVariant() {
    if (!name.trim()) return;
    const v = { id: generateId(), name: name.trim(), resumeText: profile.resumeText, createdAt: getToday() };
    setProfile(p => ({ ...p, resumeVariants: [...(p.resumeVariants || []), v], activeResumeId: v.id }));
    setName("");
  }

  function activate(id) { setProfile(p => ({ ...p, activeResumeId: id })); }
  function remove(id) {
    setProfile(p => ({ ...p, resumeVariants: p.resumeVariants.filter(v => v.id !== id), activeResumeId: p.activeResumeId === id ? null : p.activeResumeId }));
  }

  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ fontSize: "12px", color: "#6a6880", marginBottom: "10px" }}>Resume Variants</div>
      {(profile.resumeVariants || []).map(v => (
        <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(20,20,35,0.5)", border: `1px solid ${v.id === profile.activeResumeId ? "#c9a84c" : "#2a2840"}`, borderRadius: "6px", marginBottom: "6px" }}>
          <span style={{ fontSize: "12px", color: v.id === profile.activeResumeId ? "#c9a84c" : "#8a85a0" }}>{v.name}</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {v.id !== profile.activeResumeId && <button onClick={() => activate(v.id)} style={{ ...S.btnGhost, fontSize: "10px", padding: "2px 8px" }}>Activate</button>}
            <button onClick={() => remove(v.id)} style={{ ...S.btnGhost, fontSize: "10px", padding: "2px 8px", color: "#8a4040" }}>✕</button>
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Variant name (e.g. VP Tech)" style={{ ...S.input, flex: 1, fontSize: "12px" }} />
        <button onClick={addVariant} disabled={!name.trim()} style={{ ...S.btnGhost, fontSize: "11px", opacity: name.trim() ? 1 : 0.5 }}>Save Variant</button>
      </div>
    </div>
  );
}

function ProfileTab({ profile, setProfile }) {
  const [resumeText, setResumeText] = useState(profile.resumeText || "");
  const [extracting, setExtracting] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setResumeText(ev.target.result);
    reader.readAsText(file);
  }

  async function saveProfile() {
    setExtracting(true);
    let contact = {};
    if (resumeText && !profile.name) {
      try { contact = await extractContactFromResume(resumeText); } catch {}
    }
    const stripped = stripPreIntelRoles(resumeText);
    setProfile(p => ({ ...p, resumeText: stripped, resumeUploaded: true, ...contact }));
    setSaved(true);
    setExtracting(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const fields = [
    ["name", "Full Name"], ["email", "Email"], ["phone", "Phone"],
    ["address", "Location"], ["linkedin", "LinkedIn URL"], ["website", "Website"],
  ];

  return (
    <div style={S.tab}>
      <div style={S.label}>Profile</div>

      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", color: "#6a6880", marginBottom: "8px" }}>Career Tier</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[["student","Student"],["midlevel","Mid-Level"],["senior","Senior"],["executive","Executive"]].map(([v, l]) => (
            <button key={v} onClick={() => setProfile(p => ({ ...p, profileTier: v }))} style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", border: "1px solid", borderColor: profile.profileTier === v ? "#c9a84c" : "#2a2840", background: profile.profileTier === v ? "rgba(201,168,76,0.1)" : "transparent", color: profile.profileTier === v ? "#c9a84c" : "#6a6880" }}>{l}</button>
          ))}
        </div>
      </div>

      {fields.map(([k, l]) => (
        <div key={k} style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "11px", color: "#4a4860", marginBottom: "4px" }}>{l}</div>
          <input value={profile[k] || ""} onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))} style={{ ...S.input, width: "100%" }} />
        </div>
      ))}

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#4a4860", marginBottom: "4px" }}>Professional Summary (optional)</div>
        <textarea value={profile.background || ""} onChange={e => setProfile(p => ({ ...p, background: e.target.value }))} rows={4} style={{ ...S.input, width: "100%", resize: "vertical" }} placeholder="Additional context for AI (achievements, target roles, constraints)…" />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: "#4a4860", marginBottom: "8px" }}>Resume Text</div>
        <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={8} style={{ ...S.input, width: "100%", resize: "vertical", fontSize: "11px" }} placeholder="Paste resume text here, or upload a .txt file below…" />
        <input type="file" accept=".txt,.md" onChange={handleFile} style={{ marginTop: "8px", fontSize: "11px", color: "#6a6880" }} />
        <div style={{ fontSize: "10px", color: "#3a3860", marginTop: "4px" }}>Pre-Intel roles (Proudcloud, Bookmans) are automatically stripped.</div>
      </div>

      <button onClick={saveProfile} disabled={extracting} style={{ ...S.btn, display: "flex", gap: "8px", alignItems: "center", opacity: extracting ? 0.5 : 1 }}>
        {extracting ? <><Spinner /> Extracting contact…</> : "Save Profile"}
      </button>
      {saved && <div style={{ fontSize: "11px", color: "#4ade80", marginTop: "8px" }}>✓ Profile saved</div>}

      <ResumeVariantManager profile={profile} setProfile={setProfile} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────

function RoleWorkspace({ card, cards, setCards, profile, stories, onClose }) {
  const [activeTab, setActiveTab] = useState("resume");
  const [jd, setJd] = useState(card.jd || "");

  // Persist JD to card
  useEffect(() => {
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, jd } : c));
  }, [jd]);

  function updateCard(updates) {
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, ...updates } : c));
  }

  const liveCard = cards.find(c => c.id === card.id) || card;

  const TABS = [
    { id: "resume", label: "Resume" },
    { id: "cover", label: "Cover Letter" },
    { id: "prep", label: "Interview Prep" },
    { id: "research", label: "Research" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,8,20,0.96)", zIndex: 200, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #1a1830", flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "#e8e6f0" }}>
            <input value={liveCard.company || ""} onChange={e => updateCard({ company: e.target.value })} placeholder="Company" style={{ background: "transparent", border: "none", color: "#e8e6f0", fontSize: "15px", fontWeight: 700, outline: "none", width: "160px" }} />
            <span style={{ color: "#3a3860" }}> · </span>
            <input value={liveCard.title || ""} onChange={e => updateCard({ title: e.target.value })} placeholder="Title" style={{ background: "transparent", border: "none", color: "#8a85a0", fontSize: "13px", fontWeight: 400, outline: "none", width: "200px" }} />
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
            {STAGES.map(s => (
              <button key={s} onClick={() => updateCard({ stage: s })} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", border: "1px solid", cursor: "pointer", borderColor: liveCard.stage === s ? STAGE_COLORS[s].border : "#2a2840", background: liveCard.stage === s ? STAGE_COLORS[s].bg : "transparent", color: liveCard.stage === s ? STAGE_COLORS[s].text : "#3a3860" }}>{s}</button>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#6a6880", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>✕</button>
      </div>

      {/* JD strip */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid #1a1830", flexShrink: 0 }}>
        <textarea value={jd} onChange={e => setJd(e.target.value)} rows={2} placeholder="Paste job description here…" style={{ ...S.input, width: "100%", fontSize: "11px", resize: "vertical" }} />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #1a1830", flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: "10px", background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #c9a84c" : "2px solid transparent", color: activeTab === t.id ? "#c9a84c" : "#4a4860", fontSize: "12px", cursor: "pointer", fontWeight: activeTab === t.id ? 600 : 400 }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === "resume" && <ResumeTab profile={profile} card={liveCard} jd={jd} />}
        {activeTab === "cover" && <CoverLetterTab profile={profile} card={liveCard} jd={jd} />}
        {activeTab === "prep" && <InterviewPrepTab profile={profile} card={liveCard} jd={jd} stories={stories} />}
        {activeTab === "research" && <ResearchTab profile={profile} card={liveCard} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────

function BottomNav({ active, onChange }) {
  const tabs = [
    { id: "board",    icon: "⬡", label: "Board" },
    { id: "search",   icon: "⌕", label: "Search" },
    { id: "analyze",  icon: "✦", label: "Fit Check" },
    { id: "stories",  icon: "◈", label: "Stories" },
    { id: "profile",  icon: "◉", label: "Profile" },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,10,22,0.97)", borderTop: "1px solid #1a1830", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer", color: active === t.id ? "#c9a84c" : "#3a3860", transition: "color 0.15s" }}>
          <span style={{ fontSize: "18px", lineHeight: 1 }}>{t.icon}</span>
          <span style={{ fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: active === t.id ? 700 : 400 }}>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function NarrativeOS() {
  const { user, loading: authLoading } = useNetlifyAuth();
  const [activeTab, setActiveTab] = useState("board");
  const [profile, setProfile] = useState(() => {
    try { return { ...DEFAULT_PROFILE, ...(JSON.parse(storageGet("nos_profile") || "{}")) }; } catch { return DEFAULT_PROFILE; }
  });
  const [cards, setCards] = useState(() => {
    try { return JSON.parse(storageGet("nos_cards") || "[]"); } catch { return []; }
  });
  const [stories, setStories] = useState(() => {
    try { return JSON.parse(storageGet("nos_stories") || "[]"); } catch { return []; }
  });
  const [openCard, setOpenCard] = useState(null);
  const [jd, setJd] = useState("");
  const cost = useSessionCost();
  const apiLocked = useApiLock();

  // Persist
  useEffect(() => { storageSet("nos_profile", JSON.stringify(profile)); }, [profile]);
  useEffect(() => { storageSet("nos_cards", JSON.stringify(cards)); }, [cards]);
  useEffect(() => { storageSet("nos_stories", JSON.stringify(stories)); }, [stories]);

  function addCard() {
    const c = { id: generateId(), company: "", title: "", stage: "Radar", jd: "", tags: [], notes: "" };
    setCards(prev => [c, ...prev]);
    setOpenCard(c);
  }

  // Called from AnalyzeTab when build resume is triggered — auto-populates card fields
  function handleBuildResume({ company, role }) {
    let target = cards.find(c => c.company === company && c.stage !== "Pass");
    if (!target) {
      target = { id: generateId(), company: company || "", title: role || "", stage: "Applied", jd, tags: [], notes: "" };
      setCards(prev => [target, ...prev]);
    } else {
      setCards(prev => prev.map(c => c.id === target.id ? {
        ...c,
        company: c.company || company || "",
        title: c.title || role || "",
      } : c));
    }
    setOpenCard(target);
  }

  function handleAddToTracker(job) {
    const exists = cards.find(c => c.company === job.company && c.title === job.title);
    if (!exists) {
      const c = { id: generateId(), company: job.company || "", title: job.title || "", stage: "Radar", jd: "", tags: [], notes: job.snippet || "" };
      setCards(prev => [c, ...prev]);
    }
    setActiveTab("board");
  }

  if (authLoading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#080814", color: "#3a3860" }}><Spinner size={24} /></div>;
  if (!user) return <LoginGate />;

  return (
    <div style={{ background: "#080814", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#e8e6f0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 10px", borderBottom: "1px solid #1a1830", position: "sticky", top: 0, background: "rgba(8,8,20,0.95)", zIndex: 50, backdropFilter: "blur(8px)" }}>
        <div style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "0.06em", color: "#c9a84c" }}>NARRATIVE<span style={{ color: "#4a4860" }}>OS</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {apiLocked && <span style={{ fontSize: "10px", color: "#c9a84c", background: "rgba(201,168,76,0.1)", padding: "2px 8px", borderRadius: "10px" }}>⏳ Rate limit</span>}
          {cost > 0 && <span style={{ fontSize: "10px", color: "#3a3860" }}>${cost.toFixed(4)}</span>}
          <div style={{ fontSize: "11px", color: "#3a3860" }}>{user.email?.split("@")[0]}</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ paddingBottom: "80px" }}>
        {activeTab === "board" && (
          <div style={{ padding: "16px 16px 0" }}>
            <Board cards={cards} onCardClick={c => setOpenCard(c)} onAddCard={addCard} />
          </div>
        )}
        {activeTab === "search" && <JobSearchTab profile={profile} onAnalyzeJob={job => { setJd(job.snippet || ""); setActiveTab("analyze"); }} onAddToTracker={handleAddToTracker} />}
        {activeTab === "analyze" && <AnalyzeTab jd={jd} setJd={setJd} stories={stories} corrections={{}} onSaveCorrections={() => {}} onBuildResume={handleBuildResume} onResumeOnly={handleBuildResume} onNewJD={() => setJd("")} profile={profile} onAddToTracker={handleAddToTracker} />}
        {activeTab === "stories" && <MyStoriesTab profile={profile} stories={stories} setStories={setStories} />}
        {activeTab === "profile" && <ProfileTab profile={profile} setProfile={setProfile} />}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />

      {openCard && (
        <RoleWorkspace
          card={openCard}
          cards={cards}
          setCards={setCards}
          profile={profile}
          stories={stories}
          onClose={() => setOpenCard(null)}
        />
      )}
    </div>
  );
}
