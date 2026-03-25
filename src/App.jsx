export default function App() {
  const { user, authLoading, login, logout } = useNetlifyAuth();

  // while Netlify Identity initializes
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

  // not logged in → show login gate
  if (!user) {
    return <LoginGate />;
  }

  // logged in → show main app (very simple first)
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
            style={{ ...S.btnGhost, fontSize: "12px", padding: "6px 12px" }}
          >
            Log out
          </button>
        </header>

        {/* TEMP: show a simple message so we can verify render */}
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
            App loaded
          </div>
          <div style={{ fontSize: "14px", color: "#a8a0c8" }}>
            If you can see this after logging in, the render path is working.
            Next we can re‑enable tabs and the full UI.
          </div>
        </div>
      </div>
    </div>
  );
}
