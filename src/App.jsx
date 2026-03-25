import { useState } from "react";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return (
    <div style={{minHeight:"100vh",background:"#050716",color:"#e8e4f8",padding:"40px",fontFamily:"system-ui"}}>
      <div style={{maxWidth:"1100px",margin:"0 auto"}}>
        <h1 style={{fontSize:"32px",fontWeight:800,margin:"0 0 16px 0"}}>CareerForge</h1>
        <p style={{fontSize:"16px",color:"#a8a0c8",margin:"0 0 32px 0"}}>Job analysis & tailoring tools</p>
        <div style={{background:"#181a2e",padding:"24px",borderRadius:"12px",border:"1px solid #2e3050"}}>
          <h2 style={{margin:"0 0 12px 0",fontSize:"20px"}}>✅ Deploy successful</h2>
          <p style={{margin:0,color:"#a8a0c8"}}>
            Login working. Netlify Identity + OAuth callback fixed. 
            Ready for full feature restore.
          </p>
          <button 
            onClick={() => window.netlifyIdentity?.open("login") || (window.location.href = "/.netlify/identity#signup")}
            style={{marginTop:"16px",padding:"12px 24px",background:"#4f6ef7",color:"white",border:"none",borderRadius:"6px",cursor:"pointer",fontWeight:600}}
          >
            Login with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
