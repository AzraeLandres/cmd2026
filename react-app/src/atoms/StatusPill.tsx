const STATUS_CONFIG: Record<string, [string, string]> = {
  LIVE: ['En direct', 'bg-live text-white animate-pulse'],
  SUSPENDED: ['Suspendu', 'bg-live text-white'],
  FINISHED: ['Terminé', 'bg-border text-textMuted'],
  SCHEDULED: ['Programmé', 'border border-border text-textMuted'],
  TIMED: ['Programmé', 'border border-border text-textMuted'],
  POSTPONED: ['Reporté', 'border border-border text-textMuted'],
  CANCELED: ['Annulé', 'border border-border text-textMuted'],
};

export default function StatusPill({ status }: { status: string }) {
  const [label, cls] = STATUS_CONFIG[status] ?? [
    status,
    'border border-border text-textMuted',
  ];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}
      aria-label={`Statut : ${label}`}
    >
      {label}
    </span>
  );
}
