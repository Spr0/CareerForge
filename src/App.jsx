**Pure JSX `App.jsx` — copy-paste only this code, nothing else**:

```jsx
import { useState, useEffect } from "react";

function useNetlifyAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ni = window.netlifyIdentity;
    if (!ni) {
      setLoading(false);
      return;
    }
    const onInit = u => { setUser(u); setLoading(false); };
    const onLogin = u => { setUser(u); ni.close(); };
    const onLogout = () => setUser(null);
    ni.on("init", onInit);
    ni.on("login", onLogin);
    ni.on("logout", onLogout);
    if (ni.currentUser()) setUser(ni.currentUser());
    return () => {
      ni.off("init", onInit);
      ni.off("login", onLogin);
      ni.off("logout", onLogout);
    };
  }, []);

  const login = () => window.netlifyIdentity?.open("login") || (window.location.href = "/.netlify/identity#signup");
  const logout
  
