import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);
const KEY = "sa_api_key";

export function AuthProvider({ children }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY) || "");

  function login(key) {
    localStorage.setItem(KEY, key);
    setApiKey(key);
  }

  function logout() {
    localStorage.removeItem(KEY);
    setApiKey("");
  }

  return (
    <AuthContext.Provider value={{ apiKey, login, logout, isAuth: !!apiKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
