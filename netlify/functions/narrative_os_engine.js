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
    const reqWords = r.split(" ").filter(w => w.length > 4);

    const scored = allBullets.map(b => {
      const overlap = reqWords.filter(w => b.norm.includes(w)).length;

      let bonus = 0;

      if (b.norm.includes("program")) bonus += 1;
      if (b.norm.includes("executive")) bonus += 1;
      if (b.norm.includes("governance")) bonus += 1;

      return {
        ...b,
        score: overlap + bonus
      };
    });

    const sorted = scored.sort((a, b) => b.score - a.score);

    const best = sorted.filter(s => s.score > 0);

    if (best.length > 0) {
      partial.push(req);

      trace.push({
        requirement: req,
        status: "partial",
        evidence: best.slice(0, 2)
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
    ((partial.length * 0.7) / total) * 100
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
