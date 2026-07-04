import { useNavigate } from 'react-router-dom';

interface Props {
  title:      string;
  showBack:   boolean;
  liveMinute: number | null;
}

export default function TopBar({ title, showBack, liveMinute }: Props) {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      {showBack ? (
        <button
          type="button"
          className="back-btn"
          aria-label="Retour à la page précédente"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
      ) : (
        <span className="back-btn-spacer" aria-hidden="true" />
      )}
      <h1 className="topbar-title">{title}</h1>
      {liveMinute != null ? (
        <span
          className="badge-live"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Minute ${liveMinute} — match en direct`}
        >
          {liveMinute}'
        </span>
      ) : (
        <span className="back-btn-spacer" aria-hidden="true" />
      )}
    </header>
  );
}
