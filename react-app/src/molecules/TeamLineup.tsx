interface Props {
  team:    string;
  players: string[];
}

export default function TeamLineup({ team, players }: Props) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-sm font-semibold text-text">{team}</div>
      {players.length === 0 ? (
        <div className="text-sm text-textMuted">Non disponible</div>
      ) : (
        <ol
          className="list-inside list-decimal space-y-1 text-sm text-text marker:text-textMuted"
          aria-label={`Composition de ${team}`}
        >
          {players.map((name, i) => (
            <li key={i}>{name}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
