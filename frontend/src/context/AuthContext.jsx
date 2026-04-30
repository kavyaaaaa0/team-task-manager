import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("ttm_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.data.user);
      } catch (error) {
        localStorage.removeItem("ttm_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async ({ email, password }) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user: loggedInUser } = response.data.data;
    localStorage.setItem("ttm_token", token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const signup = async ({ name, email, password, role }) => {
    const response = await api.post("/auth/signup", { name, email, password, role });
    const { token, user: signedUpUser } = response.data.data;
    localStorage.setItem("ttm_token", token);
    setUser(signedUpUser);
    return signedUpUser;
  };

  const logout = () => {
    localStorage.removeItem("ttm_token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      logout,
      isAdmin: user?.role === "admin",
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
