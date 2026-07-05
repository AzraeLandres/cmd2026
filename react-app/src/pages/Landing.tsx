interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

export default function Landing({ onLogin, onRegister }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-appBg px-6 text-center">
      <div>
        <div className="mb-3 text-5xl" aria-hidden="true">
          🏆
        </div>
        <h1 className="text-2xl font-bold text-white">
          Coupe du Monde 2026
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-white/80">
          Suis les matchs en direct, parie avec tes amis et grimpe au
          classement.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={onRegister}
          className="rounded-lg bg-accent py-3 text-sm font-semibold text-white"
        >
          Créer un compte
        </button>
        <button
          type="button"
          onClick={onLogin}
          className="rounded-lg border border-white/40 py-3 text-sm font-semibold text-white"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}
