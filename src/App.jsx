import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// NETLIFY IDENTITY HOOK
// ─────────────────────────────────────────────────────────────────────────────

function useNetlifyAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const ni = window.netlifyIdentity;
    if (!ni) {
      console.warn("Netlify Identity widget not found");
      setAuthLoading(false);
      return;
    }

    const onInit = (u) => {
      setUser(u);
      setAuthLoading(false);
    };
    const onLogin = (u) => {
      setUser(u);
      ni.close();
    };
    const onLogout = () => setUser(null);

    ni.on("init", onInit);
    ni.on("login", onLogin);
    ni.on("logout", onLogout);

    if (ni.currentUser) {
      setUser(ni.currentUser());
      setAuthLoading(false);
    }

    return () => {
      ni.off("init", onInit);
      ni.off("login", onLogin);
      ni.off("logout", onLogout);
    };
  }, []);

  const login = () => {
    const ni = window.netlifyIdentity;
    if (ni) ni.open("login");
    else window.location.href = "/.netlify/identity#signup";
  };
  const logout = () => window.netlifyIdentity?.logout();

  return { user, authLoading, login, logout };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN GATE
// ─────────────────────────────────────────────────────────────────────────────

function LoginGate() {
  const handleLogin = () => {
    const ni = window.netlifyIdentity;
    if (ni) {
      ni.open("login");
    } else {
      window.location.href = "/.netlify/identity#signup";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f1117",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#e8e4f8",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              letterSpacing: "-1px",
              marginBottom: "8px",
            }}
          >
            CareerForge
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#6860a0",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Job Search Intelligence
          </div>
        </div>
        <div
          style={{
            background: "#181a2e",
            border: "1px solid #2e3050",
            borderRadius: "16px",
            padding: "40px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#e8e4f8",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              marginBottom: "8px",
            }}
          >
            Sign in to continue
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#6860a0",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              lineHeight: "1.6",
              marginBottom: "32px",
            }}
          >
            Your profile, stories, and documents are private to your account.
          </div>
          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              background: "#ffffff",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "8px",
              padding: "13px 20px",
              fontSize: "15px",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
              />
            </svg>
            Continue with Google
          </button>
          <div
            style={{
              marginTop: "24px",
              fontSize: "12px",
              color: "#4a4868",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              lineHeight: "1.6",
              textAlign: "center",
            }}
          >
            Your data stays in your browser. AI processing uses the Anthropic API.
            <a
              href="https://www.anthropic.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#5a5abf",
                textDecoration: "none",
                marginLeft: "4px",
              }}
            >
              Privacy policy →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const { user, authLoading, login, logout } = useNetlifyAuth();

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f1117",
          color: "#e8e4f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div>Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <LoginGate />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050716",
        color: "#e8e4f8",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "24px 16px 40px",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "-0.5px",
              }}
            >
              CareerForge
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6860a0",
                textTransform: "uppercase",
                letterSpacing: "1.6px",
              }}
            >
              Job Search Intelligence
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: "transparent",
              color: "#a8a0c8",
              border: "1px solid #3a3d5c",
              borderRadius: "6px",
              padding: "10px 18px",
              fontSize: "13px",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </header>

        <div
          style={{
            background: "#181a2e",
            border: "1px solid #2e3050",
            borderRadius: "10px",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "8px",
            }}
          >
            App loaded ✅
          </div>
          <div style={{ fontSize: "14px", color: "#a8a0c8" }}>
            Login works. Next step: add back your tabs and profile data.
          </div>
        </div>
      </div>
    </div>
  );
}
