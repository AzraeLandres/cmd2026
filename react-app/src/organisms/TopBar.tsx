import { useNavigate } from 'react-router-dom';

interface Props {
  title:      string;
  showBack:   boolean;
  liveMinute: number | null;
}

export default function TopBar({ title, showBack, liveMinute }: Props) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-surface/95 px-1 py-3 shadow-sm backdrop-blur">
      {showBack ? (
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-text transition-colors hover:bg-black/5"
          aria-label="Retour à la page précédente"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden="true" />
      )}
      <h1 className="flex-1 truncate text-center text-lg font-bold text-text">
        {title}
      </h1>
      {liveMinute != null ? (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full bg-live px-2 py-0.5 text-xs font-semibold text-white"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Minute ${liveMinute} — match en direct`}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
          {liveMinute}'
        </span>
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden="true" />
      )}
    </header>
  );
}
