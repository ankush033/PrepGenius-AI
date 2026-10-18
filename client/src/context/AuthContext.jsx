import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { AuthContext } from "./auth-context";
const TOKEN_KEY = "token";
const USER_KEY = "user";

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("activeConversation");
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const login = useCallback(({ token, user: authenticatedUser }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setStatus("unauthenticated");
      return () => { active = false; };
    }

    api.get("/auth/me").then(({ data }) => {
      if (!active) return;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setStatus("authenticated");
    }).catch((error) => {
      if (!active) return;
      if (error.response?.status === 401) {
        logout();
      } else {
        // Do not grant access until the backend has verified the stored token.
        setStatus("unauthenticated");
      }
    });

    return () => { active = false; };
  }, [logout]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [logout]);

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
