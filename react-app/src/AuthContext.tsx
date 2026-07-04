import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apolloClient } from './apollo';
import { GET_ME } from './graphql/queries';

interface AuthUser {
  id:          number;
  username:    string;
  displayName: string;
}

interface AuthContextValue {
  user:   AuthUser | null;
  token:  string | null;
  login:  (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'cdm_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,  setUser]  = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
  });

  useEffect(() => {
    if (!token) return;
    apolloClient.query({ query: GET_ME, fetchPolicy: 'network-only' })
      .then(({ data }) => { if (data?.me) setUser(data.me); })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
      });
  }, [token]);

  function login(newToken: string, newUser: AuthUser) {
    sessionStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    apolloClient.clearStore();
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
