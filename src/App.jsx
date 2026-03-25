You're right—iterative deploys are inefficient. Here's the **complete, production-ready `App.jsx`** with **all your core features** (tabs, JD analysis, resume/cover letter, profile, stories) in one deploy:

**Copy-paste this entire file as `src/App.jsx`**:

```jsx
import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CORE INFRASTRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

function useNetlifyAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const ni = window.netlifyIdentity;
    if (!ni) {
      setAuthLoading(false);
      return;
    }

    const onInit = (u) => { setUser(u); setAuthLoading(false); };
    const onLogin = (u) => { setUser(u); ni.close(); };
    const onLogout = () => setUser(null);

    ni.on("init", onInit);
    ni.on("login", onLogin);
    ni.on("logout", onLogout);

    if (ni.currentUser()) {
      setUser(ni.currentUser());
      setAuthLoading(false);
    }

    return () => {
      ni.off("init", onInit);
      ni.off("login", onLogin);
      ni.off("logout", onLogout);
    };
  }, []);

  const login = () => window.netlifyIdentity?.open("login") || (window.location.href = "/.netlify/identity#signup");
  const logout = () => window.netlifyIdentity?.logout();

  return { user, authLoading, login, logout };
}

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

async function callClaude(system, user, maxTokens = 2000) {
  if (!ANTHROPIC_API_KEY) throw new Error("VITE_ANTHROPIC_API_KEY missing");
  
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || `API ${res.status}`);
  return data.content?.[0]?.text || "";
}

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const S = {
  section: { background: "#181a2e", border: "1px solid #2e3050", borderRadius: "10px", padding: "24px", marginBottom: "20px" },
  btn: { background: "#4f6ef7", color: "#ffffff", border: "none", borderRadius: "6px", padding: "11px 24px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  btnGhost: { background: "transparent", color: "#a8a0c8", border: "1px solid #3a3d5c", borderRadius: "6px", padding: "10px 18px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  input: { width: "100%", background: "#1e2035
