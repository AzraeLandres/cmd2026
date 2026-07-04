import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useAuth } from "@context/AuthContext";
import { LOGIN, REGISTER } from "@graphql/mutations";

type Mode = "register" | "login";

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>("register");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [doLogin, { loading: loginLoading }] = useMutation(LOGIN);
  const [doRegister, { loading: registerLoading }] = useMutation(REGISTER);

  const loading = loginLoading || registerLoading;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setUsername("");
    setDisplayName("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        const { data } = await doLogin({ variables: { username, password } });
        login(data.login.token, data.login.user);
      } else {
        const { data } = await doRegister({
          variables: {
            username,
            password,
            displayName: displayName || username,
          },
        });
        login(data.register.token, data.register.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(msg.replace("ApolloError: ", ""));
    }
  }

  const isRegister = mode === "register";

  return (
    <div className="flex items-center justify-center min-h-screen bg-appBg">
      <div className="w-full max-w-sm bg-surface rounded-md shadow-app py-8 px-6 flex flex-col gap-5">
        <h1 className="text-xl font-bold text-center text-accent">
          {isRegister ? "Inscription" : "Connexion"}
        </h1>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          {isRegister && (
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-displayname" className="text-sm font-medium">
                Prénom
              </label>
              <input
                id="auth-displayname"
                type="text"
                className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="auth-username" className="text-sm font-medium">
              Nom d'utilisateur
            </label>
            <input
              id="auth-username"
              type="text"
              className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="auth-password" className="text-sm font-medium">
              Mot de passe
            </label>
            <input
              id="auth-password"
              type="password"
              className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white rounded-lg py-2 font-semibold text-sm disabled:opacity-50"
          >
            {loading ? "…" : isRegister ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          {isRegister ? (
            <>
              J'ai déjà un compte.{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-primary font-medium underline"
              >
                Se connecter
              </button>
            </>
          ) : (
            <>
              Je n'ai pas de compte.{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-primary font-medium underline"
              >
                S'inscrire
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
