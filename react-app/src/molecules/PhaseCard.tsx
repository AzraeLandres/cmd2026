import { Link } from 'react-router-dom';
import { CARD } from '@utils/ui';

interface Props {
  code:   string;
  label:  string;
  count?: number;
}

export default function PhaseCard({ code, label, count }: Props) {
  return (
    <Link
      to={`/matches/${code}`}
      className={`${CARD} flex items-center justify-between`}
      aria-label={count != null ? `${label}, ${count} match${count > 1 ? 's' : ''}` : label}
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {count != null && (
          <div className="mt-0.5 text-xs text-textMuted">
            {count} match{count > 1 ? 's' : ''}
          </div>
        )}
      </div>
      <span className="text-lg text-textMuted" aria-hidden="true">›</span>
    </Link>
  );
}
