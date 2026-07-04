import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useAuth } from '../AuthContext';
import { LOGIN, REGISTER } from '../graphql/mutations';

type Mode = 'register' | 'login';

export default function AuthPage() {
  const { login }               = useAuth();
  const [mode, setMode]         = useState<Mode>('register');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);

  const [doLogin,    { loading: loginLoading }]    = useMutation(LOGIN);
  const [doRegister, { loading: registerLoading }] = useMutation(REGISTER);

  const loading = loginLoading || registerLoading;

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setUsername('');
    setDisplayName('');
    setPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        const { data } = await doLogin({ variables: { username, password } });
        login(data.login.token, data.login.user);
      } else {
        const { data } = await doRegister({ variables: { username, password, displayName: displayName || username } });
        login(data.register.token, data.register.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(msg.replace('ApolloError: ', ''));
    }
  }

  const isRegister = mode === 'register';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card-title">
          {isRegister ? 'Inscription' : 'Connexion'}
        </h1>

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <div className="auth-field">
              <label htmlFor="auth-displayname">Prénom / pseudo affiché</label>
              <input
                id="auth-displayname"
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-username">Nom d'utilisateur</label>
            <input
              id="auth-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete={isRegister ? 'username' : 'username'}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Mot de passe</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? '…' : isRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-switch-link">
          {isRegister ? (
            <>J'ai déjà un compte.{' '}
              <button type="button" onClick={() => switchMode('login')}>Se connecter</button>
            </>
          ) : (
            <>Je n'ai pas de compte.{' '}
              <button type="button" onClick={() => switchMode('register')}>S'inscrire</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
