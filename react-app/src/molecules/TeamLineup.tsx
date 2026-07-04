interface Props {
  team:    string;
  players: string[];
}

export default function TeamLineup({ team, players }: Props) {
  return (
    <div className="lineup-col">
      <div className="lineup-team">{team}</div>
      {players.length === 0 ? (
        <div className="muted">Non disponible</div>
      ) : (
        <ol className="lineup-list" aria-label={`Composition de ${team}`}>
          {players.map((name, i) => (
            <li key={i}>{name}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
