import { useState, useEffect, useCallback } from "react";

// ── Profile & Constants ───────────────────────────────────────────────────────

const PROFILE = {
  name: "Scott Henderson",
  title: "Enterprise Transformation Leader",
  focus: "VP Technology | Renewable Energy | Enterprise Applications",
  background: `Senior transformation leader with 15+ years driving enterprise-scale change at grid-scale renewable energy companies and Fortune 500 technology organizations. VP of Technology at EDF Renewables and Cypress Creek Renewables with full P&L ownership — budget, revenue forecasting, margin management, and board/C-suite reporting. Earlier career as enterprise agile coach at Nike and Intel. Known for translating complex technology strategy into measurable P&L outcomes. Located in Bellingham, WA.`,
  proofPoints: [
    "$28M annualized EBITDA improvement at EDF Renewables through platform consolidation",
    "27% reduction in compliance-related fines at CCR via AI governance implementation",
    "$13M SaaS catalog identified through ledger mining → 15% OPEX reduction",
    "Full P&L ownership at both CCR and EDF — budget, forecasting, margin, board reporting",
    "Enterprise agile coach at Nike and Intel — transformation at scale",
  ],
  certifications: [
    "Lean Six Sigma Black Belt — Intel internal certification program (VERIFIED — do not flag as a gap)",
    "Lean Six Sigma Green Belt — LinkedIn Learning certification",
    "Lean Six Sigma Black Belt — LinkedIn Learning certification",
  ],
  implementations: [
    "NetSuite ERP — full end-to-end implementation at Cypress Creek Renewables, on time and under budget (VERIFIED ERP EXPERIENCE — do not flag as a gap)",
    "Salesforce + Sitetracker — full implementation at CCR for project portfolio management",
    "Oracle Financial Consolidation and Close (FCC) — full implementation at CCR",
    "Blackline — financial close automation, full implementation at CCR",
    "NSPB (NetSuite Planning and Budgeting) — full implementation at CCR",
    "Snowflake — data platform implementation at CCR",
    "All implementations delivered on time and under budget — hands-on implementation lead, not oversight",
  ],
  products: [
    "Nike Airbag Inspection Platform — led full product lifecycle from whiteboard to production deployment. Generated ~$600M revenue in first year. Led OCM and global factory adoption. Platform still in active use. This is verified IT/digital product experience including build, deploy, change management, and adoption (VERIFIED PRODUCT EXPERIENCE — do not flag IT product experience as a gap)",
  ],
  industries: [
    "Renewable energy (grid-scale solar, wind, storage) — EDF Renewables, Cypress Creek Renewables",
    "Consumer products / manufacturing — Nike (global factory operations, airbag inspection platform)",
    "Semiconductor / technology manufacturing — Intel",
    "Highly regulated, capital-intensive, compliance-heavy industries across all roles",
  ],
  security: [
    "US Citizen — no impediments to obtaining security clearance. Can commence process immediately upon offer.",
  ],
};

const RESUME_BASELINE = `SCOTT HENDERSON
Bellingham, WA | scott@hendersonsolution.com | linkedin.com/in/mrscotthenderson | hendersonsolution.com

SUMMARY
Enterprise transformation leader with 15+ years driving technology-led change at grid-scale renewable energy companies and Fortune 500 organizations. Full P&L accountability at VP level — budget ownership, revenue forecasting, margin management, and board/C-suite reporting. Proven track record of translating complex technology strategy into measurable business outcomes.

EXPERIENCE

VP of Technology | EDF Renewables | 2021–2024
- Led enterprise-scale platform consolidation delivering $28M annualized EBITDA improvement
- Identified $13M SaaS catalog through ledger mining; executed rationalization delivering 15% OPEX reduction
- Owned full technology P&L including budget, vendor contracts, and capital allocation
- Reported directly to C-suite and board on technology strategy, risk, and performance

Senior Director, Enterprise Applications | Cypress Creek Renewables | 2018–2021
- Designed and deployed AI governance framework reducing compliance-related fines by 27%
- Led enterprise application portfolio across project development, asset management, and finance systems
- Managed $X budget with full P&L accountability
- Built and led teams of 15+ across internal and vendor resources

Enterprise Agile Coach | Nike | 2016–2018
- Coached enterprise agile transformation across multiple technology program teams
- Designed and delivered coaching programs; built internal coaching bench
- Facilitated executive alignment sessions and scaled agile framework adoption

Enterprise Agile Coach | Intel | 2014–2016
- Led agile transformation engagements across enterprise technology programs
- Established scaled delivery frameworks and coaching practices

EDUCATION
[Degree] | [Institution]

SKILLS
Enterprise transformation · P&L management · Technology strategy · AI governance · Platform architecture · Vendor management · Agile at scale · ERP/EAM/CMMS · Board-level communication`;

const COMPETENCIES = [
  "Transformation", "Financial Impact", "Leadership", "Technical",
  "Agile/Delivery", "Governance", "Vendor Management", "Strategy", "Stakeholder"
];

const SEED_STORIES = [
  {
    id: "story-001",
    title: "$28M EBITDA Improvement — EDF Renewables",
    company: "EDF Renewables", role: "VP Technology",
    competencies: ["Financial Impact", "Transformation", "Technical"],
    situation: "EDF Renewables had a fragmented technology landscape across its U.S. renewable energy portfolio — redundant platforms, siloed data, and no consolidated view of asset performance or cost.",
    task: "As VP of Technology, I was accountable for identifying and executing a platform consolidation strategy that would reduce operational cost while improving data quality and reporting capability.",
    action: "Led a cross-functional team to audit the full technology stack, identified $13M in redundant SaaS spend through ledger mining, rationalized the vendor portfolio, and rearchitected core operational platforms to eliminate duplication. Built the business case, presented to C-suite and board, and owned execution through go-live.",
    result: "$28M annualized EBITDA improvement through platform consolidation and cost elimination. 15% OPEX reduction. Improved reporting accuracy to board level.",
    tags: ["P&L", "platform consolidation", "cost reduction", "board reporting", "enterprise architecture"],
    starred: true,
  },
  {
    id: "story-002",
    title: "27% Reduction in Compliance Fines — CCR AI Governance",
    company: "Cypress Creek Renewables", role: "Senior Director, Enterprise Applications",
    competencies: ["Governance", "Technical", "Financial Impact"],
    situation: "Cypress Creek Renewables was facing escalating compliance-related fines due to inconsistent data governance and manual audit processes across its renewable energy project portfolio.",
    task: "Design and implement an AI-assisted governance framework that would reduce compliance risk and demonstrate measurable reduction in regulatory exposure.",
    action: "Architected and deployed an AI governance implementation covering automated compliance monitoring, audit trail generation, and exception flagging. Built stakeholder alignment across legal, operations, and finance. Managed vendor selection and implementation.",
    result: "27% reduction in compliance-related fines. Repeatable governance framework adopted across the portfolio. Reduced manual audit burden by approximately 40%.",
    tags: ["AI governance", "compliance", "risk reduction", "regulatory", "automation"],
    starred: true,
  },
  {
    id: "story-003",
    title: "$13M SaaS Catalog Identified via Ledger Mining",
    company: "EDF Renewables", role: "VP Technology",
    competencies: ["Financial Impact", "Vendor Management", "Strategy"],
    situation: "No single owner had visibility into the full SaaS spend across EDF Renewables' U.S. operations. Contracts were distributed across business units with no consolidated catalog.",
    task: "Surface total SaaS exposure, identify redundancy, and build a rationalization roadmap.",
    action: "Designed and executed a ledger mining process — working with finance to extract and categorize all SaaS-related spend from AP records. Built a vendor catalog, mapped redundancies, and developed a rationalization plan with phased vendor exits.",
    result: "$13M SaaS catalog identified. Rationalization plan delivered 15% OPEX reduction. Established ongoing SaaS governance process preventing future unchecked sprawl.",
    tags: ["SaaS rationalization", "spend analysis", "vendor management", "OPEX", "ledger mining"],
    starred: false,
  },
  {
    id: "story-004",
    title: "Enterprise Agile Transformation — Nike",
    company: "Nike", role: "Enterprise Agile Coach",
    competencies: ["Transformation", "Leadership", "Agile/Delivery"],
    situation: "Nike was scaling agile practices across multiple enterprise technology programs with inconsistent adoption, methodology fragmentation, and low coaching maturity.",
    task: "As enterprise agile coach, build coaching capability, align methodology across teams, and accelerate delivery performance.",
    action: "Designed and delivered coaching programs across multiple program teams. Introduced scaled agile frameworks, facilitated leadership alignment sessions, and built internal coach capability.",
    result: "Improved delivery predictability across coached programs. Built internal coaching bench. Established repeatable transformation patterns later applied at Intel and in renewables context.",
    tags: ["agile", "coaching", "transformation", "enterprise", "Nike"],
    starred: false,
  },
];

const TABS = ["Library", "Analyze JD", "Resume", "Cover Letter", "Interview Prep", "Research"];

// ── Storage ───────────────────────────────────────────────────────────────────

async function storageGet(key) {
  try {
    const r = await window.storage.get(key);
    return r?.value ? JSON.parse(r.value) : null;
  } catch { return null; }
}

async function storageSet(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch {}
}

// ── API ───────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

async function callClaude(system, user, maxTokens = 2000) {
  if (!ANTHROPIC_API_KEY) throw new Error("API key not configured. Set VITE_ANTHROPIC_API_KEY in environment.");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
      messages: [{ role: "user", content: user }]
    })
  });
  let raw = "";
  try {
    raw = await response.text();
    const data = JSON.parse(raw);
    if (!response.ok || data.error) throw new Error(data.error?.message || `API ${response.status}`);
    return data.content?.find(b => b.type === "text")?.text || "";
  } catch (e) {
    throw new Error(e.message || `Parse failed: ${raw.slice(0, 200)}`);
  }
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const S = {
  input: {
    width: "100%", background: "#0d0e1a", border: "1px solid #2a2a3a",
    borderRadius: "4px", color: "#c0b8d8", fontFamily: "system-ui, sans-serif",
    fontSize: "13px", padding: "9px 12px", outline: "none", boxSizing: "border-box"
  },
  textarea: {
    width: "100%", background: "#0d0e1a", border: "1px solid #2a2a3a",
    borderRadius: "4px", color: "#c0b8d8", fontFamily: "Georgia, serif",
    fontSize: "13px", lineHeight: "1.7", padding: "12px", resize: "vertical",
    outline: "none", boxSizing: "border-box"
  },
  btn: {
    background: "#4a4abf", color: "#e0e0ff", border: "none",
    borderRadius: "4px", padding: "10px 24px", fontSize: "13px",
    fontFamily: "system-ui, sans-serif", fontWeight: "600", cursor: "pointer"
  },
  btnGhost: {
    background: "transparent", color: "#5a5870", border: "1px solid #2a2a3a",
    borderRadius: "4px", padding: "10px 18px", fontSize: "13px",
    fontFamily: "system-ui, sans-serif", cursor: "pointer"
  },
  label: {
    display: "block", fontSize: "10px", letterSpacing: "2px",
    textTransform: "uppercase", color: "#5858a0", fontFamily: "system-ui, sans-serif",
    fontWeight: "600", marginBottom: "8px"
  },
  section: {
    background: "rgba(255,255,255,0.02)", border: "1px solid #1e1e2e",
    borderRadius: "8px", padding: "24px", marginBottom: "20px"
  },
  resultBox: {
    background: "#0d0e1a", border: "1px solid #2a2a3a", borderRadius: "6px",
    padding: "20px", fontFamily: "Georgia, serif", fontSize: "14px",
    lineHeight: "1.8", color: "#b8b0d0", whiteSpace: "pre-wrap", wordBreak: "break-word"
  }
};

function Spinner() {
  return (
    <>
      <span style={{
        display: "inline-block", width: 13, height: 13,
        border: "2px solid #333", borderTopColor: "#7a7adf",
        borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ ...S.btnGhost, fontSize: "11px", padding: "5px 12px", color: copied ? "#7a9a7a" : "#5a5870" }}
    >{copied ? "✓ Copied" : "Copy"}</button>
  );
}

function JDInput({ jd, setJd }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <label style={S.label}>Job Description — paste here to use across all tools</label>
      <textarea
        value={jd} onChange={e => setJd(e.target.value)}
        placeholder="Paste the full job description here…"
        rows={6} style={S.textarea}
        onFocus={e => e.target.style.borderColor = "#4a4abf"}
        onBlur={e => e.target.style.borderColor = "#2a2a3a"}
      />
    </div>
  );
}

function ResultSection({ title, result, loading, error }) {
  if (!result && !loading && !error) return null;
  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ ...S.label, margin: 0 }}>{title}</div>
        {result && <CopyBtn text={result} />}
      </div>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#4a4860", fontFamily: "system-ui, sans-serif", fontSize: "13px" }}>
          <Spinner /> Generating…
        </div>
      )}
      {error && <div style={{ color: "#c06060", fontFamily: "system-ui, sans-serif", fontSize: "13px", wordBreak: "break-word" }}>{error}</div>}
      {result && <div style={S.resultBox}>{result}</div>}
    </div>
  );
}

// ── Gap Correction Modal ──────────────────────────────────────────────────────

function AnalysisModal({ score, rationale, gaps, fullResult, onProceed, onCorrect, onNewJD }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "20px"
    }}>
      <div style={{
        background: "#111228", border: "1px solid #2a2a3a", borderRadius: "12px",
        width: "100%", maxWidth: "680px", maxHeight: "85vh", overflowY: "auto",
        padding: "32px", boxShadow: "0 24px 80px rgba(0,0,0,0.6)"
      }}>
        {/* Score */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            fontSize: "64px", fontWeight: "700", lineHeight: 1,
            color: score >= 8 ? "#7adf8a" : score >= 6 ? "#c9a84c" : "#df7a7a",
            fontFamily: "system-ui, sans-serif"
          }}>{score}<span style={{ fontSize: "28px", color: "#3a3858" }}>/10</span></div>
          <div style={{
            fontSize: "13px", color: "#7a7090", fontFamily: "system-ui, sans-serif",
            marginTop: "8px", lineHeight: "1.5", maxWidth: "480px", margin: "8px auto 0"
          }}>{rationale}</div>
        </div>

        {/* Gaps */}
        {gaps.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <div style={{
              fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
              color: "#5858a0", fontFamily: "system-ui, sans-serif", fontWeight: "600", marginBottom: "12px"
            }}>Gaps to Address ({gaps.length})</div>
            {gaps.map((gap, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid #1e1e2e",
                borderRadius: "6px", padding: "14px 16px", marginBottom: "8px"
              }}>
                <div style={{
                  fontSize: "13px", fontWeight: "600", color: "#c0b0d8",
                  fontFamily: "system-ui, sans-serif", marginBottom: "4px"
                }}>{gap.title}</div>
                <div style={{
                  fontSize: "12px", color: "#5a5070", fontFamily: "system-ui, sans-serif", lineHeight: "1.6"
                }}>{gap.assessment}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={onProceed} style={{
            background: "#4a4abf", color: "#e0e0ff", border: "none",
            borderRadius: "6px", padding: "12px 24px", fontSize: "13px",
            fontFamily: "system-ui, sans-serif", fontWeight: "600", cursor: "pointer", flex: 1
          }}>Proceed to Full Analysis →</button>
          <button onClick={onCorrect} style={{
            background: "rgba(201,168,76,0.12)", color: "#c9a84c",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "6px", padding: "12px 20px", fontSize: "13px",
            fontFamily: "system-ui, sans-serif", cursor: "pointer", flex: 1
          }}>Correct a Gap</button>
          <button onClick={onNewJD} style={{
            background: "rgba(99,180,160,0.12)", color: "#6ab8a8",
            border: "1px solid rgba(99,180,160,0.35)",
            borderRadius: "6px", padding: "12px 20px", fontSize: "13px",
            fontFamily: "system-ui, sans-serif", cursor: "pointer", flex: 1
          }}>New JD Analysis</button>
        </div>
      </div>
    </div>
  );
}

function GapCorrectionPanel({ gaps, corrections, onSave, onDone }) {
  const [local, setLocal] = useState(
    gaps.map(g => ({ ...g, flagged: false, userCorrection: corrections[g.title] || "" }))
  );

  const toggle = (i) => setLocal(prev => prev.map((g, idx) => idx === i ? { ...g, flagged: !g.flagged } : g));
  const update = (i, val) => setLocal(prev => prev.map((g, idx) => idx === i ? { ...g, userCorrection: val } : g));

  const handleSave = () => {
    const updated = {};
    local.forEach(g => { if (g.flagged && g.userCorrection.trim()) updated[g.title] = g.userCorrection.trim(); });
    onSave(updated);
  };

  return (
    <div style={{ background: "#0d0e1a", border: "1px solid #2a2a3a", borderRadius: "8px", padding: "24px", marginBottom: "24px" }}>
      <div style={{ fontSize: "14px", fontWeight: "600", color: "#c0b8d8", fontFamily: "system-ui, sans-serif", marginBottom: "4px" }}>
        Correct the Gaps
      </div>
      <div style={{ fontSize: "12px", color: "#4a4860", fontFamily: "system-ui, sans-serif", marginBottom: "20px" }}>
        Flag any gap the AI got wrong and provide your correction. Corrections are saved and used in all future analyses.
      </div>

      {local.map((gap, i) => (
        <div key={i} style={{
          border: `1px solid ${gap.flagged ? "rgba(201,168,76,0.4)" : "#1e1e2e"}`,
          borderRadius: "6px", padding: "14px 16px", marginBottom: "10px",
          background: gap.flagged ? "rgba(201,168,76,0.04)" : "rgba(255,255,255,0.01)"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <button onClick={() => toggle(i)} style={{
              background: gap.flagged ? "#c9a84c" : "transparent",
              border: `1px solid ${gap.flagged ? "#c9a84c" : "#3a3858"}`,
              borderRadius: "3px", width: "18px", height: "18px", cursor: "pointer",
              flexShrink: 0, marginTop: "2px", fontSize: "11px", color: "#0f1117",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>{gap.flagged ? "✓" : ""}</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#c0b0d8", fontFamily: "system-ui, sans-serif", marginBottom: "3px" }}>
                {gap.title}
              </div>
              <div style={{ fontSize: "12px", color: "#4a4060", fontFamily: "system-ui, sans-serif", lineHeight: "1.5" }}>
                {gap.assessment}
              </div>
              {gap.flagged && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", color: "#8a7040", fontFamily: "system-ui, sans-serif", marginBottom: "6px" }}>
                    Your Correction
                  </div>
                  <textarea
                    value={gap.userCorrection}
                    onChange={e => update(i, e.target.value)}
                    placeholder="e.g. I DO have LSSBB — Intel internal certification plus LinkedIn Learning GB and BB. This is not a gap."
                    rows={3}
                    style={{
                      width: "100%", background: "#0a0b14", border: "1px solid #c9a84c",
                      borderRadius: "4px", color: "#c0b8d8", fontFamily: "system-ui, sans-serif",
                      fontSize: "13px", lineHeight: "1.6", padding: "10px",
                      resize: "vertical", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <button onClick={handleSave} style={{
          background: "#c9a84c", color: "#0f1117", border: "none",
          borderRadius: "4px", padding: "10px 24px", fontSize: "13px",
          fontFamily: "system-ui, sans-serif", fontWeight: "600", cursor: "pointer"
        }}>Save Corrections</button>
        <button onClick={onDone} style={{
          background: "transparent", color: "#5a5070", border: "1px solid #2a2a3a",
          borderRadius: "4px", padding: "10px 18px", fontSize: "13px",
          fontFamily: "system-ui, sans-serif", cursor: "pointer"
        }}>Done</button>
      </div>
    </div>
  );
}

// ── Tab: Analyze JD ───────────────────────────────────────────────────────────

function AnalyzeTab({ jd, setJd, stories, corrections, onSaveCorrections, onAnalysisComplete }) {
  const [fullResult, setFullResult] = useState("");
  const [parsedGaps, setParsedGaps] = useState([]);
  const [parsedScore, setParsedScore] = useState(null);
  const [parsedRationale, setParsedRationale] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCorrections, setShowCorrections] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const buildSystemPrompt = () => {
    const correctionText = Object.entries(corrections).length > 0
      ? `\n\nUSER CORRECTIONS FROM PREVIOUS ANALYSES (treat these as verified facts — do NOT re-flag as gaps):\n${Object.entries(corrections).map(([k, v]) => `- "${k}": ${v}`).join("\n")}`
      : "";

    return `You are a senior career strategist helping ${PROFILE.name}, ${PROFILE.title}.

BACKGROUND: ${PROFILE.background}

PROOF POINTS: ${PROFILE.proofPoints.join("; ")}

CERTIFICATIONS (VERIFIED): ${PROFILE.certifications.join("; ")}

ERP/PLATFORM IMPLEMENTATIONS (VERIFIED — hands-on implementation lead, not oversight): ${PROFILE.implementations.join("; ")}

PRODUCT EXPERIENCE (VERIFIED): ${PROFILE.products.join("; ")}

INDUSTRY EXPERIENCE: ${PROFILE.industries.join("; ")}

SECURITY/CLEARANCE: ${PROFILE.security.join("; ")}

CRITICAL INSTRUCTION: Before flagging ANY gap, check the verified facts above. If Scott has the skill, certification, or experience listed above, do NOT flag it as a gap. Only flag genuine, verified gaps.${correctionText}

Analyze job descriptions and return a JSON object with this exact structure:
{
  "score": <number 1-10>,
  "company": "<company name extracted from the JD>",
  "rationale": "<one sentence explaining the score>",
  "keyRequirements": ["<req1>", "<req2>", "<req3>", "<req4>", "<req5>"],
  "strongestAngles": [{"angle": "<angle>", "why": "<why>"}],
  "topStories": [{"story": "<story title>", "useFor": "<question type>"}],
  "gaps": [{"title": "<gap name>", "assessment": "<honest 1-sentence assessment>", "framing": "<suggested framing>"}],
  "keywords": ["<kw1>", "<kw2>"]
}

Return ONLY the JSON object. No markdown, no preamble.`;
  };

  const run = async () => {
    if (!jd.trim()) return;
    setLoading(true); setError(null); setFullResult(""); setShowFull(false); setShowModal(false);
    try {
      const storyTitles = stories.map((s, i) => `${i + 1}. "${s.title}" — ${s.competencies.join(", ")} | Result: ${s.result}`).join("\n");
      const text = await callClaude(buildSystemPrompt(), `Stories:\n${storyTitles}\n\nJob Description:\n${jd}`, 3000);

      // Parse JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse analysis response");
      const parsed = JSON.parse(jsonMatch[0]);

      setParsedScore(parsed.score);
      setParsedRationale(parsed.rationale);
      setParsedGaps(parsed.gaps || []);
      setFullResult(formatFullResult(parsed));
      setShowModal(true);
      // Trigger research agent with extracted company
      if (onAnalysisComplete && parsed.company) onAnalysisComplete(parsed.company);
    } catch (e) { setError(`Analysis failed: ${e.message}`); }
    finally { setLoading(false); }
  };

  const formatFullResult = (p) => {
    const lines = [];
    lines.push(`FIT SCORE: ${p.score}/10\n${p.rationale}\n`);
    lines.push(`KEY REQUIREMENTS:\n${p.keyRequirements?.map(r => `• ${r}`).join("\n") || ""}\n`);
    lines.push(`STRONGEST ANGLES:\n${p.strongestAngles?.map(a => `• ${a.angle}\n  → ${a.why}`).join("\n") || ""}\n`);
    lines.push(`TOP STORIES TO TELL:\n${p.topStories?.map(s => `• "${s.story}"\n  → Use for: ${s.useFor}`).join("\n") || ""}\n`);
    if (p.gaps?.length > 0) {
      lines.push(`GAPS TO ADDRESS:\n${p.gaps.map(g => `• ${g.title}\n  Assessment: ${g.assessment}\n  Framing: ${g.framing}`).join("\n\n")}\n`);
    } else {
      lines.push("GAPS: None identified.\n");
    }
    lines.push(`KEYWORDS TO INCLUDE:\n${p.keywords?.join(", ") || ""}`);
    return lines.join("\n");
  };

  const handleSaveCorrections = (newCorrections) => {
    onSaveCorrections({ ...corrections, ...newCorrections });
    setShowCorrections(false);
    setShowModal(false);
  };

  return (
    <div>
      {showModal && (
        <AnalysisModal
          score={parsedScore}
          rationale={parsedRationale}
          gaps={parsedGaps}
          fullResult={fullResult}
          onProceed={() => { setShowModal(false); setShowFull(true); }}
          onCorrect={() => { setShowModal(false); setShowCorrections(true); }}
          onNewJD={() => { setShowModal(false); setJd(""); setFullResult(""); }}
        />
      )}

      <JDInput jd={jd} setJd={setJd} />

      {Object.keys(corrections).length > 0 && (
        <div style={{
          background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "4px", padding: "10px 14px", marginBottom: "16px",
          fontFamily: "system-ui, sans-serif", fontSize: "12px", color: "#8a7040",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span>✓ {Object.keys(corrections).length} gap correction{Object.keys(corrections).length > 1 ? "s" : ""} active — AI will not re-flag these</span>
          <button onClick={() => setShowCorrections(true)} style={{
            background: "none", border: "none", color: "#c9a84c", cursor: "pointer", fontSize: "12px"
          }}>View / edit</button>
        </div>
      )}

      <button onClick={run} disabled={!jd.trim() || loading} style={{
        ...S.btn, opacity: !jd.trim() || loading ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px"
      }}>
        {loading ? <><Spinner /> Analyzing…</> : "Analyze JD"}
      </button>

      {error && <div style={{ color: "#c06060", fontFamily: "system-ui, sans-serif", fontSize: "13px", marginBottom: "16px", wordBreak: "break-word" }}>{error}</div>}

      {showCorrections && parsedGaps.length > 0 && (
        <GapCorrectionPanel
          gaps={parsedGaps}
          corrections={corrections}
          onSave={handleSaveCorrections}
          onDone={() => setShowCorrections(false)}
        />
      )}

      {showFull && fullResult && (
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ ...S.label, margin: 0 }}>Full Analysis</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <CopyBtn text={fullResult} />
              {parsedGaps.length > 0 && (
                <button onClick={() => setShowCorrections(!showCorrections)} style={{
                  ...S.btnGhost, fontSize: "11px", padding: "5px 12px", color: "#c9a84c", borderColor: "rgba(201,168,76,0.3)"
                }}>Correct gaps</button>
              )}
            </div>
          </div>
          <div style={S.resultBox}>{fullResult}</div>
        </div>
      )}
    </div>
  );
}

// ── DOCX helpers (uses docx npm package) ─────────────────────────────────────

async function downloadDocx(content, filename) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("https://esm.sh/docx@8.5.0");

  const lines = content.split("\n");
  const children = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ text: "" }));
      continue;
    }
    // Section headers (ALL CAPS lines or lines ending with :)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes("@")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, bold: true, size: 22, color: "2F2B8F" })],
        spacing: { before: 240, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } }
      }));
    } else if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace(/^[•\-]\s*/, ""), size: 20 })],
        bullet: { level: 0 },
        spacing: { after: 40 }
      }));
    } else if (trimmed.startsWith("→") || trimmed.startsWith(">")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace(/^[→>]\s*/, ""), size: 20, italics: true, color: "555555" })],
        spacing: { after: 40 }, indent: { left: 360 }
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 20 })],
        spacing: { after: 60 }
      }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20 } }
      }
    }
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function downloadResumeDocx(resumeText, tailoringNotes, company) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, UnderlineType } = await import("https://esm.sh/docx@8.5.0");

  const contactLine = "Bellingham, WA  |  scott@hendersonsolution.com  |  linkedin.com/in/mrscotthenderson  |  hendersonsolution.com";
  const children = [
    // Name
    new Paragraph({
      children: [new TextRun({ text: "SCOTT HENDERSON", bold: true, size: 32, color: "1a1a4a" })],
      alignment: AlignmentType.CENTER, spacing: { after: 80 }
    }),
    // Contact
    new Paragraph({
      children: [new TextRun({ text: contactLine, size: 18, color: "555555" })],
      alignment: AlignmentType.CENTER, spacing: { after: 200 }
    }),
    // Divider
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "2F2B8F" } },
      spacing: { after: 160 }
    }),
    // Tailoring notes header
    new Paragraph({
      children: [new TextRun({ text: "TAILORING RECOMMENDATIONS FOR: " + (company || "THIS ROLE"), bold: true, size: 22, color: "2F2B8F" })],
      spacing: { before: 120, after: 80 }
    }),
  ];

  // Add tailoring notes as formatted paragraphs
  const noteLines = tailoringNotes.split("\n");
  for (const line of noteLines) {
    const trimmed = line.trim();
    if (!trimmed) { children.push(new Paragraph({ text: "", spacing: { after: 40 } })); continue; }
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 4 && !trimmed.includes("@")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, bold: true, size: 21, color: "2F2B8F" })],
        spacing: { before: 180, after: 60 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" } }
      }));
    } else if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace(/^[•\-]\s*/, ""), size: 20 })],
        bullet: { level: 0 }, spacing: { after: 40 }
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 20 })],
        spacing: { after: 60 }
      }));
    }
  }

  // Divider before base resume
  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "2F2B8F" } },
    spacing: { before: 240, after: 160 }
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: "BASE RESUME (for reference)", bold: true, size: 20, color: "888888" })],
    spacing: { after: 120 }
  }));

  for (const line of resumeText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) { children.push(new Paragraph({ text: "", spacing: { after: 40 } })); continue; }
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 4 && !trimmed.includes("@") && !trimmed.includes("|")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, bold: true, size: 21, color: "333333" })],
        spacing: { before: 160, after: 60 }
      }));
    } else if (trimmed.startsWith("-")) {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed.replace(/^-\s*/, ""), size: 20 })],
        bullet: { level: 0 }, spacing: { after: 40 }
      }));
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: trimmed, size: 20 })],
        spacing: { after: 60 }
      }));
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: { default: { document: { run: { font: "Calibri" } } } }
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Scott_Henderson_Resume_Tailored${company ? "_" + company.replace(/\s+/g, "_") : ""}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadCoverLetterDocx(letterText, company, role) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import("https://esm.sh/docx@8.5.0");

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const children = [
    new Paragraph({
      children: [new TextRun({ text: "SCOTT HENDERSON", bold: true, size: 28, color: "1a1a4a" })],
      spacing: { after: 60 }
    }),
    new Paragraph({
      children: [new TextRun({ text: "Bellingham, WA  |  scott@hendersonsolution.com  |  hendersonsolution.com", size: 18, color: "555555" })],
      spacing: { after: 60 }
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2F2B8F" } },
      spacing: { after: 280 }
    }),
    new Paragraph({
      children: [new TextRun({ text: today, size: 20, color: "555555" })],
      spacing: { after: 280 }
    }),
  ];

  if (company || role) {
    if (company) children.push(new Paragraph({ children: [new TextRun({ text: company, size: 20, bold: true })], spacing: { after: 40 } }));
    if (role) children.push(new Paragraph({ children: [new TextRun({ text: role, size: 20, color: "555555" })], spacing: { after: 280 } }));
  }

  // Letter body
  for (const line of letterText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) { children.push(new Paragraph({ text: "", spacing: { after: 120 } })); continue; }
    children.push(new Paragraph({
      children: [new TextRun({ text: trimmed, size: 22 })],
      spacing: { after: 80 }, alignment: AlignmentType.JUSTIFIED
    }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: { default: { document: { run: { font: "Calibri" } } } }
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Scott_Henderson_CoverLetter${company ? "_" + company.replace(/\s+/g, "_") : ""}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Tab: Resume ───────────────────────────────────────────────────────────────

function ResumeTab({ jd, setJd }) {
  const [resume, setResume] = useState(RESUME_BASELINE);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [showResume, setShowResume] = useState(false);

  const run = async () => {
    if (!jd.trim()) return;
    setLoading(true); setError(null); setResult("");
    try {
      const system = `You are a senior executive resume strategist helping ${PROFILE.name}, ${PROFILE.title}.
His background: ${PROFILE.background}
His proof points: ${PROFILE.proofPoints.join("; ")}
His certifications: ${PROFILE.certifications.join("; ")}
His implementations: ${PROFILE.implementations.join("; ")}

Given his resume and a job description, provide:
1. SUMMARY REWRITE — a tailored 3-sentence summary optimized for this specific role
2. TOP 5 BULLET EDITS — specific existing bullets to strengthen or rewrite, with the revised version
3. BULLETS TO PROMOTE — which achievements to move higher or emphasize more
4. KEYWORDS TO ADD — specific phrases from the JD missing from the resume
5. WHAT TO DE-EMPHASIZE — anything that doesn't serve this application

Output should be immediately actionable — give the actual rewritten text, not just advice.`;
      const text = await callClaude(system, `Job Description:\n${jd}\n\nCurrent Resume:\n${resume}`, 2500);
      setResult(text);
    } catch (e) { setError(`Failed: ${e.message}`); }
    finally { setLoading(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Extract company from JD first line or use generic
      const companyMatch = jd.match(/(?:at|for|with|joining)\s+([A-Z][A-Za-z\s&,\.]+?)(?:\s+is|\s+are|\s+we|\.|,)/);
      const company = companyMatch ? companyMatch[1].trim() : "";
      await downloadResumeDocx(resume, result, company);
    } catch (e) { setError(`Download failed: ${e.message}`); }
    finally { setDownloading(false); }
  };

  return (
    <div>
      <JDInput jd={jd} setJd={setJd} />
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ ...S.label, margin: 0 }}>Resume Baseline</label>
          <button onClick={() => setShowResume(!showResume)} style={{ ...S.btnGhost, fontSize: "11px", padding: "4px 10px" }}>
            {showResume ? "Hide" : "Edit baseline"}
          </button>
        </div>
        {showResume && (
          <textarea value={resume} onChange={e => setResume(e.target.value)}
            rows={12} style={S.textarea}
            onFocus={e => e.target.style.borderColor = "#4a4abf"}
            onBlur={e => e.target.style.borderColor = "#2a2a3a"} />
        )}
      </div>

      <button onClick={run} disabled={!jd.trim() || loading} style={{
        ...S.btn, opacity: !jd.trim() || loading ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px"
      }}>
        {loading ? <><Spinner /> Tailoring…</> : "Tailor Resume"}
      </button>

      {error && <div style={{ color: "#c06060", fontFamily: "system-ui, sans-serif", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

      {result && (
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ ...S.label, margin: 0 }}>Resume Tailoring Recommendations</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <CopyBtn text={result} />
              <button onClick={handleDownload} disabled={downloading} style={{
                ...S.btn, padding: "5px 14px", fontSize: "11px",
                background: downloading ? "#2a2a3a" : "#3a5abf",
                display: "flex", alignItems: "center", gap: "6px"
              }}>
                {downloading ? <><Spinner />…</> : "⬇ Download .docx"}
              </button>
            </div>
          </div>
          <div style={S.resultBox}>{result}</div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Cover Letter ─────────────────────────────────────────────────────────

function CoverLetterTab({ jd, setJd }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [extracting, setExtracting] = useState(false);

  // Auto-extract company + role from JD when it changes
  useEffect(() => {
    if (!jd.trim() || (company && role)) return;
    const timer = setTimeout(async () => {
      setExtracting(true);
      try {
        const text = await callClaude(
          `Extract the company name and job title from a job description. Return ONLY a JSON object: {"company": "...", "role": "..."}. If not found, use empty string. No other text.`,
          jd.slice(0, 1500), 200
        );
        const match = text.match(/\{[\s\S]*?\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.company && !company) setCompany(parsed.company);
          if (parsed.role && !role) setRole(parsed.role);
        }
      } catch {} finally { setExtracting(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [jd]);

  const run = async () => {
    if (!jd.trim()) return;
    setLoading(true); setError(null); setResult("");
    try {
      const system = `You are writing a cover letter for ${PROFILE.name}, ${PROFILE.title}.
His background: ${PROFILE.background}
His proof points: ${PROFILE.proofPoints.join("; ")}

Voice guidelines:
- Direct and confident, not sycophantic
- Lead with business impact, not years of experience
- Specific proof points over generic claims
- One strong opening hook — not "I am writing to apply for…"
- 3 tight paragraphs maximum — executives don't write long cover letters
- Close with forward momentum, not "I look forward to hearing from you"
- Sign off: Scott Henderson

Write a complete, ready-to-send cover letter. No placeholders or commentary — just the letter.`;
      const userMsg = `Company: ${company || "the company"}
Role: ${role || "this position"}
${notes ? `Additional context: ${notes}` : ""}

Job Description:
${jd}`;
      const text = await callClaude(system, userMsg, 1500);
      setResult(text);
    } catch (e) { setError(`Failed: ${e.message}`); }
    finally { setLoading(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try { await downloadCoverLetterDocx(result, company, role); }
    catch (e) { setError(`Download failed: ${e.message}`); }
    finally { setDownloading(false); }
  };

  return (
    <div>
      <JDInput jd={jd} setJd={setJd} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={S.label}>
            Company Name
            {extracting && <span style={{ color: "#4a4abf", marginLeft: "8px", letterSpacing: 0, textTransform: "none", fontSize: "11px" }}>extracting from JD…</span>}
          </label>
          <input value={company} onChange={e => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp" style={S.input}
            onFocus={e => e.target.style.borderColor = "#4a4abf"}
            onBlur={e => e.target.style.borderColor = "#2a2a3a"} />
        </div>
        <div>
          <label style={S.label}>Role Title</label>
          <input value={role} onChange={e => setRole(e.target.value)}
            placeholder="e.g. VP of Technology" style={S.input}
            onFocus={e => e.target.style.borderColor = "#4a4abf"}
            onBlur={e => e.target.style.borderColor = "#2a2a3a"} />
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={S.label}>Additional Context <span style={{ color: "#3a3858", textTransform: "none", letterSpacing: 0 }}>optional</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Referred by John Smith. Emphasize the CCR governance work. They care about culture fit…"
          rows={3} style={S.textarea}
          onFocus={e => e.target.style.borderColor = "#4a4abf"}
          onBlur={e => e.target.style.borderColor = "#2a2a3a"} />
      </div>

      <button onClick={run} disabled={!jd.trim() || loading} style={{
        ...S.btn, opacity: !jd.trim() || loading ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px"
      }}>
        {loading ? <><Spinner /> Drafting…</> : "Draft Cover Letter"}
      </button>

      {error && <div style={{ color: "#c06060", fontFamily: "system-ui, sans-serif", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}

      {result && (
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ ...S.label, margin: 0 }}>Cover Letter Draft</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <CopyBtn text={result} />
              <button onClick={handleDownload} disabled={downloading} style={{
                ...S.btn, padding: "5px 14px", fontSize: "11px",
                background: downloading ? "#2a2a3a" : "#3a5abf",
                display: "flex", alignItems: "center", gap: "6px"
              }}>
                {downloading ? <><Spinner />…</> : "⬇ Download .docx"}
              </button>
            </div>
          </div>
          <div style={S.resultBox}>{result}</div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Interview Prep ───────────────────────────────────────────────────────

function InterviewPrepTab({ jd, setJd, stories }) {
  const [round, setRound] = useState("screening");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    if (!jd.trim()) return;
    setLoading(true); setError(null); setResult("");
    try {
      const storyContext = stories.map(s =>
        `"${s.title}": ${s.result}`
      ).join("\n");
      const system = `You are an executive interview coach preparing ${PROFILE.name} for a ${round} interview.
His background: ${PROFILE.background}
His proof points: ${PROFILE.proofPoints.join("; ")}
His STAR stories: ${storyContext}

Generate:
1. LIKELY QUESTIONS — 8 questions this interviewer will probably ask, based on the JD
2. ANGLE FOR EACH — for each question, the specific story or proof point Scott should lead with, and the key message to land
3. TRICKY QUESTIONS — 3 harder questions (gaps, concerns, failures) with suggested honest framings
4. QUESTIONS TO ASK — 4 sharp questions Scott should ask the interviewer that signal strategic thinking

Format clearly with the question, then the coaching note. Be specific to Scott's background, not generic.`;
      const text = await callClaude(system, `Interview round: ${round}\n\nJob Description:\n${jd}`, 3000);
      setResult(text);
    } catch (e) { setError(`Failed: ${e.message}`); }
    finally { setLoading(false); }
  };

  const rounds = ["screening", "hiring manager", "panel", "executive", "final"];

  return (
    <div>
      <JDInput jd={jd} setJd={setJd} />

      <div style={{ marginBottom: "20px" }}>
        <label style={S.label}>Interview Round</label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {rounds.map(r => (
            <button key={r} onClick={() => setRound(r)} style={{
              ...S.btnGhost, fontSize: "12px", padding: "6px 14px",
              background: round === r ? "rgba(99,140,255,0.15)" : "transparent",
              color: round === r ? "#8aacff" : "#5a5870",
              borderColor: round === r ? "#4a6abf" : "#2a2a3a",
              textTransform: "capitalize"
            }}>{r}</button>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={!jd.trim() || loading} style={{
        ...S.btn, opacity: !jd.trim() || loading ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px"
      }}>
        {loading ? <><Spinner /> Preparing…</> : `Prep for ${round} interview`}
      </button>
      <ResultSection title={`Interview Prep — ${round}`} result={result} loading={loading} error={error} />
    </div>
  );
}

// ── Tab: Research Agent ───────────────────────────────────────────────────────

const RESEARCH_STEPS = [
  { key: "overview",        label: "Company overview & structure",       query: (c) => `${c} company overview mission revenue employees structure 2024 2025` },
  { key: "leadership",      label: "Leadership & org structure",          query: (c) => `${c} executive leadership team CEO CTO VP org structure 2024 2025` },
  { key: "financials",      label: "Financial health & stability",        query: (c) => `${c} financial results revenue growth funding stability 2024 2025` },
  { key: "transformation",  label: "Transformation & strategic initiatives", query: (c) => `${c} digital transformation technology strategy initiatives 2024 2025` },
];

const OPTIONAL_STEPS = [
  { key: "news",    label: "＋ Recent News",      query: (c) => `${c} news announcements 2025` },
  { key: "culture", label: "＋ Culture Signals",  query: (c) => `${c} company culture values employee reviews Glassdoor 2024 2025` },
];

async function runResearchSearch(company, query) {
  const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";
  if (!ANTHROPIC_API_KEY) throw new Error("API key not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
      system: `You are a research analyst preparing a concise briefing about ${company} for a senior executive job candidate. 
Search for the requested information and summarize in 3-5 clear, factual sentences. 
Focus on what a candidate would need to know before an interview. Be specific — include numbers, names, and dates where available.
Do not editorialize or speculate beyond what the search returns.`,
      messages: [{ role: "user", content: query }]
    })
  });

  let raw = "";
  try {
    raw = await response.text();
    const data = JSON.parse(raw);
    if (!response.ok || data.error) throw new Error(data.error?.message || `API ${response.status}`);
    // Extract text blocks — web search responses may have multiple content blocks
    const textBlocks = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    return textBlocks || "No information found.";
  } catch (e) {
    throw new Error(e.message || `Parse failed: ${raw.slice(0, 200)}`);
  }
}

function ResearchTab({ company, jd, triggered }) {
  const [results, setResults] = useState({});
  const [steps, setSteps] = useState({}); // "idle"|"loading"|"done"|"error"
  const [hasRun, setHasRun] = useState(false);
  const [overrideCompany, setOverrideCompany] = useState("");

  const effectiveCompany = overrideCompany || company;

  const runStep = async (step) => {
    if (!effectiveCompany) return;
    setSteps(p => ({ ...p, [step.key]: "loading" }));
    try {
      const result = await runResearchSearch(effectiveCompany, step.query(effectiveCompany));
      setResults(p => ({ ...p, [step.key]: result }));
      setSteps(p => ({ ...p, [step.key]: "done" }));
    } catch (e) {
      setResults(p => ({ ...p, [step.key]: `Search failed: ${e.message}` }));
      setSteps(p => ({ ...p, [step.key]: "error" }));
    }
  };

  const runAll = async (stepsToRun = RESEARCH_STEPS) => {
    setHasRun(true);
    for (const step of stepsToRun) {
      await runStep(step);
    }
  };

  // Auto-trigger when company becomes available from JD analysis
  useEffect(() => {
    if (triggered && effectiveCompany && !hasRun) {
      runAll();
    }
  }, [triggered, effectiveCompany]);

  const allCoreDone = RESEARCH_STEPS.every(s => steps[s.key] === "done" || steps[s.key] === "error");
  const anyLoading = Object.values(steps).some(s => s === "loading");

  const stepColor = (key) => {
    if (steps[key] === "done") return "#7adf8a";
    if (steps[key] === "loading") return "#c9a84c";
    if (steps[key] === "error") return "#df7a7a";
    return "#3a3858";
  };

  const stepIcon = (key) => {
    if (steps[key] === "done") return "✓";
    if (steps[key] === "loading") return "…";
    if (steps[key] === "error") return "✗";
    return "○";
  };

  return (
    <div>
      {/* Company override / trigger */}
      <div style={{ marginBottom: "24px" }}>
        <label style={S.label}>
          Company
          {company && !overrideCompany && (
            <span style={{ color: "#4a4abf", marginLeft: "8px", letterSpacing: 0, textTransform: "none", fontSize: "11px" }}>
              extracted from JD: {company}
            </span>
          )}
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            value={overrideCompany}
            onChange={e => setOverrideCompany(e.target.value)}
            placeholder={company || "Enter company name…"}
            style={{ ...S.input, flex: 1 }}
            onFocus={e => e.target.style.borderColor = "#4a4abf"}
            onBlur={e => e.target.style.borderColor = "#2a2a3a"}
          />
          <button
            onClick={() => { setResults({}); setSteps({}); setHasRun(false); setTimeout(() => runAll(), 50); }}
            disabled={!effectiveCompany || anyLoading}
            style={{
              ...S.btn, opacity: !effectiveCompany || anyLoading ? 0.5 : 1,
              display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap"
            }}
          >
            {anyLoading ? <><Spinner /> Researching…</> : hasRun ? "Re-run Research" : "Run Research"}
          </button>
        </div>
      </div>

      {/* Step progress */}
      {hasRun && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ ...S.label, marginBottom: "10px" }}>Agent Steps</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {RESEARCH_STEPS.map(step => (
              <div key={step.key} style={{
                display: "flex", alignItems: "center", gap: "10px",
                fontFamily: "system-ui, sans-serif", fontSize: "12px"
              }}>
                <span style={{ color: stepColor(step.key), width: "16px", textAlign: "center", flexShrink: 0 }}>
                  {steps[step.key] === "loading" ? <Spinner size={10} /> : stepIcon(step.key)}
                </span>
                <span style={{ color: steps[step.key] === "done" ? "#8888b8" : "#3a3858" }}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {RESEARCH_STEPS.filter(s => results[s.key]).map(step => (
        <div key={step.key} style={{ ...S.section, marginBottom: "16px" }}>
          <div style={{ ...S.label, color: "#5858a0", marginBottom: "12px" }}>{step.label}</div>
          <div style={{
            fontSize: "14px", lineHeight: "1.8", color: "#b0a8c8",
            fontFamily: "Georgia, serif",
            color: steps[step.key] === "error" ? "#c06060" : "#b0a8c8"
          }}>{results[step.key]}</div>
        </div>
      ))}

      {/* Optional sections */}
      {allCoreDone && (
        <div style={{ marginTop: "8px" }}>
          <div style={{ ...S.label, marginBottom: "10px" }}>Optional Research</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {OPTIONAL_STEPS.map(step => (
              <button
                key={step.key}
                onClick={() => runStep(step)}
                disabled={steps[step.key] === "loading" || steps[step.key] === "done"}
                style={{
                  ...S.btnGhost,
                  fontSize: "12px",
                  background: steps[step.key] === "done" ? "rgba(99,140,255,0.1)" : "transparent",
                  color: steps[step.key] === "done" ? "#8aacff" : steps[step.key] === "loading" ? "#c9a84c" : "#6ab8a8",
                  borderColor: steps[step.key] === "done" ? "#4a6abf" : "rgba(99,180,160,0.4)",
                  display: "flex", alignItems: "center", gap: "6px"
                }}
              >
                {steps[step.key] === "loading" ? <><Spinner size={10} />Loading…</> : step.label}
              </button>
            ))}
          </div>

          {/* Optional results */}
          {OPTIONAL_STEPS.filter(s => results[s.key]).map(step => (
            <div key={step.key} style={{ ...S.section, marginTop: "16px" }}>
              <div style={{ ...S.label, color: "#5858a0", marginBottom: "12px" }}>{step.label.replace("＋ ", "")}</div>
              <div style={{
                fontSize: "14px", lineHeight: "1.8",
                color: steps[step.key] === "error" ? "#c06060" : "#b0a8c8",
                fontFamily: "Georgia, serif"
              }}>{results[step.key]}</div>
            </div>
          ))}
        </div>
      )}

      {!hasRun && !effectiveCompany && (
        <div style={{
          padding: "48px", textAlign: "center", border: "1px dashed #1e1e2e",
          borderRadius: "8px", color: "#3a3858", fontFamily: "system-ui, sans-serif", fontSize: "14px"
        }}>
          Run a JD analysis first — company will be extracted automatically.<br />
          Or enter a company name above and click Run Research.
        </div>
      )}
    </div>
  );
}

// ── Tab: Library ──────────────────────────────────────────────────────────────

function Tag({ label, color = "#2a2a3a", textColor = "#8880a0" }) {
  return (
    <span style={{
      background: color, color: textColor, borderRadius: "3px",
      padding: "2px 8px", fontSize: "11px", fontFamily: "system-ui, sans-serif",
      letterSpacing: "0.3px", whiteSpace: "nowrap"
    }}>{label}</span>
  );
}

function CompetencyBadge({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: active ? "rgba(99,140,255,0.18)" : "rgba(255,255,255,0.03)",
      color: active ? "#8aacff" : "#5a5870",
      border: `1px solid ${active ? "#4a6abf" : "#2a2a3a"}`,
      borderRadius: "4px", padding: "5px 12px",
      fontSize: "12px", fontFamily: "system-ui, sans-serif",
      cursor: "pointer", transition: "all 0.15s"
    }}>{label}</button>
  );
}

function StoryCard({ story, onEdit, onDelete, onStar }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${story.starred ? "rgba(99,140,255,0.3)" : "#1e1e2e"}`,
      borderRadius: "8px", marginBottom: "12px", overflow: "hidden"
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "16px 20px", cursor: "pointer", display: "flex",
        alignItems: "flex-start", gap: "12px",
        background: expanded ? "rgba(99,140,255,0.04)" : "transparent"
      }}>
        <button onClick={(e) => { e.stopPropagation(); onStar(story.id); }} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "16px", padding: "0", marginTop: "1px", flexShrink: 0
        }}>
          {story.starred ? "⭐" : "☆"}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: "15px", fontWeight: "600", color: "#d8d0f0",
            fontFamily: "system-ui, sans-serif", marginBottom: "6px"
          }}>{story.title}</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <Tag label={story.company} color="rgba(99,140,255,0.12)" textColor="#7a9aef" />
            <Tag label={story.role} />
            {story.competencies.map(c => (
              <Tag key={c} label={c} color="rgba(180,140,255,0.1)" textColor="#b090d0" />
            ))}
          </div>
        </div>
        <div style={{ color: "#3e3a4e", fontSize: "18px", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "0 20px 20px 48px", borderTop: "1px solid #1a1a2a" }}>
          {[
            { label: "S — Situation", key: "situation", color: "#6b8080" },
            { label: "T — Task", key: "task", color: "#6b7a80" },
            { label: "A — Action", key: "action", color: "#6b6880" },
            { label: "R — Result", key: "result", color: "#7a8060" },
          ].map(({ label, key, color }) => (
            <div key={key} style={{ marginTop: "16px" }}>
              <div style={{
                fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
                color, fontFamily: "system-ui, sans-serif", fontWeight: "600", marginBottom: "6px"
              }}>{label}</div>
              <div style={{ fontSize: "14px", lineHeight: "1.7", color: "#b0a8c0", fontFamily: "Georgia, serif" }}>
                {story[key]}
              </div>
            </div>
          ))}
          {story.tags?.length > 0 && (
            <div style={{ marginTop: "16px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {story.tags.map(t => <Tag key={t} label={`#${t}`} color="rgba(255,255,255,0.04)" textColor="#4a4860" />)}
            </div>
          )}
          <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
            <button onClick={() => onEdit(story)} style={{ ...S.btnGhost, fontSize: "12px", padding: "6px 14px" }}>✏️ Edit</button>
            <button onClick={() => onDelete(story.id)} style={{ ...S.btnGhost, fontSize: "12px", padding: "6px 14px", color: "#6a3a3a", borderColor: "#2e1e1e" }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

function generateId() { return `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function StoryEditor({ story, onSave, onCancel }) {
  const blank = { id: generateId(), title: "", company: "", role: "", competencies: [], situation: "", task: "", action: "", result: "", tags: "", starred: false };
  const [form, setForm] = useState(story ? { ...story, tags: story.tags?.join(", ") || "" } : blank);

  const field = (key, label, multiline = false, hint = "") => (
    <div style={{ marginBottom: "18px" }}>
      <label style={{ ...S.label, color: "#6860a0" }}>{label}{hint && <span style={{ color: "#3e3a50", marginLeft: "8px", letterSpacing: 0, textTransform: "none", fontSize: "11px" }}>{hint}</span>}</label>
      {multiline ? (
        <textarea value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          rows={4} style={S.textarea}
          onFocus={e => e.target.style.borderColor = "#4a4abf"}
          onBlur={e => e.target.style.borderColor = "#2a2a3a"} />
      ) : (
        <input type="text" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={S.input}
          onFocus={e => e.target.style.borderColor = "#4a4abf"}
          onBlur={e => e.target.style.borderColor = "#2a2a3a"} />
      )}
    </div>
  );

  return (
    <div style={{ background: "#0d0e1a", border: "1px solid #2a2a3a", borderRadius: "8px", padding: "28px" }}>
      <div style={{ fontSize: "16px", fontWeight: "600", color: "#c0b8d8", fontFamily: "system-ui, sans-serif", marginBottom: "24px" }}>
        {story ? "Edit Story" : "Add New Story"}
      </div>
      {field("title", "Story Title")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>{field("company", "Company")}</div>
        <div>{field("role", "Role / Title")}</div>
      </div>
      <div style={{ marginBottom: "18px" }}>
        <label style={{ ...S.label, color: "#6860a0" }}>Competencies</label>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {COMPETENCIES.map(c => (
            <CompetencyBadge key={c} label={c} active={form.competencies.includes(c)}
              onClick={() => setForm(f => ({
                ...f, competencies: f.competencies.includes(c)
                  ? f.competencies.filter(x => x !== c) : [...f.competencies, c]
              }))} />
          ))}
        </div>
      </div>
      {field("situation", "S — Situation", true, "Context and background")}
      {field("task", "T — Task", true, "Your specific responsibility")}
      {field("action", "A — Action", true, "What you did — be specific")}
      {field("result", "R — Result", true, "Quantified outcomes")}
      {field("tags", "Tags", false, "comma-separated keywords")}
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button onClick={() => { if (!form.title.trim()) return; onSave({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) }); }}
          style={S.btn}>Save Story</button>
        <button onClick={onCancel} style={S.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

function LibraryTab({ stories, setStories }) {
  const [editing, setEditing] = useState(null);
  const [filterComp, setFilterComp] = useState(null);
  const [filterStarred, setFilterStarred] = useState(false);
  const [search, setSearch] = useState("");

  const handleSave = (story) => {
    setStories(prev => prev.find(s => s.id === story.id) ? prev.map(s => s.id === story.id ? story : s) : [...prev, story]);
    setEditing(null);
  };

  const handleDelete = (id) => { if (window.confirm("Delete this story?")) setStories(prev => prev.filter(s => s.id !== id)); };
  const handleStar = (id) => setStories(prev => prev.map(s => s.id === id ? { ...s, starred: !s.starred } : s));

  const filtered = stories.filter(s => {
    if (filterStarred && !s.starred) return false;
    if (filterComp && !s.competencies.includes(filterComp)) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.company.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q)) || s.result.toLowerCase().includes(q);
    }
    return true;
  });

  if (editing) return <StoryEditor story={editing === "new" ? null : editing} onSave={handleSave} onCancel={() => setEditing(null)} />;

  return (
    <div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stories…"
          style={{ ...S.input, width: "200px" }}
          onFocus={e => e.target.style.borderColor = "#4a4abf"}
          onBlur={e => e.target.style.borderColor = "#2a2a3a"} />
        <button onClick={() => setFilterStarred(!filterStarred)} style={{
          ...S.btnGhost, fontSize: "12px",
          background: filterStarred ? "rgba(99,140,255,0.15)" : "transparent",
          color: filterStarred ? "#8aacff" : "#4a4860",
          borderColor: filterStarred ? "#4a6abf" : "#2a2a3a"
        }}>⭐ Starred</button>
        <button onClick={() => setEditing("new")} style={{ ...S.btn, marginLeft: "auto", padding: "8px 18px" }}>+ Add Story</button>
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
        <CompetencyBadge label="All" active={!filterComp} onClick={() => setFilterComp(null)} />
        {COMPETENCIES.map(c => <CompetencyBadge key={c} label={c} active={filterComp === c} onClick={() => setFilterComp(filterComp === c ? null : c)} />)}
      </div>
      {filtered.length === 0 ? (
        <div style={{ color: "#3a3858", fontFamily: "system-ui, sans-serif", fontSize: "14px", padding: "40px", textAlign: "center", border: "1px dashed #1e1e2e", borderRadius: "8px" }}>
          No stories match.{" "}
          <button onClick={() => { setFilterComp(null); setFilterStarred(false); setSearch(""); }}
            style={{ background: "none", border: "none", color: "#5a5aaf", cursor: "pointer", fontSize: "14px" }}>Clear filters</button>
        </div>
      ) : (
        filtered.map(story => <StoryCard key={story.id} story={story} onEdit={setEditing} onDelete={handleDelete} onStar={handleStar} />)
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function CareerForge() {
  const [activeTab, setActiveTab] = useState("Library");
  const [stories, setStories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [jd, setJd] = useState("");
  const [corrections, setCorrections] = useState({});
  const [researchCompany, setResearchCompany] = useState("");
  const [researchTriggered, setResearchTriggered] = useState(false);

  useEffect(() => {
    Promise.all([
      storageGet("careerforge:scott:stories"),
      storageGet("careerforge:scott:jd"),
      storageGet("careerforge:scott:corrections"),
    ]).then(([s, j, c]) => {
      setStories(s || SEED_STORIES);
      setJd(j || "");
      setCorrections(c || {});
      setLoaded(true);
    });
  }, []);

  useEffect(() => { if (loaded) storageSet("careerforge:scott:stories", stories); }, [stories, loaded]);
  useEffect(() => { if (loaded) storageSet("careerforge:scott:jd", jd); }, [jd, loaded]);
  useEffect(() => { if (loaded) storageSet("careerforge:scott:corrections", corrections); }, [corrections, loaded]);

  const starredCount = stories.filter(s => s.starred).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b14", color: "#d0c8e8", fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d0e1f 0%, #111228 100%)", borderBottom: "1px solid #1e1e2e", padding: "20px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span style={{ fontSize: "22px", fontWeight: "700", color: "#c8c0e8", letterSpacing: "-0.5px" }}>CareerForge</span>
              <span style={{ fontSize: "10px", letterSpacing: "3px", color: "#4a4abf", textTransform: "uppercase", fontFamily: "system-ui, sans-serif", fontWeight: "600" }}>
                Job Search Intelligence
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#3a3858", fontFamily: "system-ui, sans-serif", marginTop: "3px" }}>
              {PROFILE.name} · {PROFILE.title}
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "system-ui, sans-serif" }}>
            <span style={{ fontSize: "12px", color: "#3a3858" }}>{stories.length} stories · {starredCount} starred</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginTop: "20px" }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? "rgba(99,140,255,0.15)" : "transparent",
              color: activeTab === tab ? "#8aacff" : "#4a4860",
              border: `1px solid ${activeTab === tab ? "#4a6abf" : "transparent"}`,
              borderBottom: activeTab === tab ? "1px solid #0a0b14" : "1px solid transparent",
              borderRadius: "4px 4px 0 0", padding: "8px 18px", fontSize: "13px",
              fontFamily: "system-ui, sans-serif", cursor: "pointer",
              marginBottom: activeTab === tab ? "-1px" : "0"
            }}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "32px 40px", maxWidth: "900px" }}>
        {!loaded ? (
          <div style={{ color: "#3a3858", fontFamily: "system-ui, sans-serif" }}>Loading…</div>
        ) : (
          <>
            {activeTab === "Library" && <LibraryTab stories={stories} setStories={setStories} />}
            {activeTab === "Analyze JD" && <AnalyzeTab jd={jd} setJd={setJd} stories={stories} corrections={corrections} onSaveCorrections={setCorrections} onAnalysisComplete={(company) => { setResearchCompany(company); setResearchTriggered(true); setActiveTab("Research"); }} />}
            {activeTab === "Resume" && <ResumeTab jd={jd} setJd={setJd} />}
            {activeTab === "Cover Letter" && <CoverLetterTab jd={jd} setJd={setJd} />}
            {activeTab === "Interview Prep" && <InterviewPrepTab jd={jd} setJd={setJd} stories={stories} />}
            {activeTab === "Research" && <ResearchTab company={researchCompany} jd={jd} triggered={researchTriggered} />}
          </>
        )}

      </div>
    </div>
  );
}
