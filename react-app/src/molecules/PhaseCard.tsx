import { Link } from 'react-router-dom';

interface Props {
  code:   string;
  label:  string;
  count?: number;
}

export default function PhaseCard({ code, label, count }: Props) {
  return (
    <Link
      to={`/matches/${code}`}
      className="card phase-card"
      aria-label={count != null ? `${label}, ${count} match${count > 1 ? 's' : ''}` : label}
    >
      <div>
        <div className="title">{label}</div>
        {count != null && (
          <div className="meta">{count} match{count > 1 ? 's' : ''}</div>
        )}
      </div>
      <span className="chevron" aria-hidden="true">›</span>
    </Link>
  );
}
