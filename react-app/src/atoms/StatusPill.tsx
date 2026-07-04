const STATUS_CONFIG: Record<string, [string, string]> = {
  LIVE:      ['En direct', 'status-live'],
  SUSPENDED: ['Suspendu',  'status-live'],
  FINISHED:  ['Terminé',   'status-finished'],
  SCHEDULED: ['Programmé', 'status-scheduled'],
  TIMED:     ['Programmé', 'status-scheduled'],
  POSTPONED: ['Reporté',   'status-scheduled'],
  CANCELED:  ['Annulé',    'status-scheduled'],
};

export default function StatusPill({ status }: { status: string }) {
  const [label, cls] = STATUS_CONFIG[status] ?? [status, 'status-scheduled'];
  return (
    <span className={`status-pill ${cls}`} aria-label={`Statut : ${label}`}>
      {label}
    </span>
  );
}
