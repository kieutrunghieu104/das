import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("das_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("das_token");
    if (!token) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("das_user", JSON.stringify(res.data.user));
      })
      .catch((error) => {
        if ([401, 403].includes(error.response?.status)) {
          logout();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(phone, password) {
    const res = await api.post("/auth/login", { phone, password });
    localStorage.setItem("das_token", res.data.token);
    localStorage.setItem("das_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    return res.data;
  }

  function logout() {
    if (localStorage.getItem("das_token")) {
      api.post("/auth/logout").catch(() => { });
    }
    localStorage.removeItem("das_token");
    localStorage.removeItem("das_user");
    setUser(null);
  }

  function updateUser(nextUser) {
    localStorage.setItem("das_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: Boolean(user)
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
