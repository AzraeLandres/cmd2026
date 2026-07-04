import fs from 'fs';
import { config } from './config';
import { Match } from '../types';

const DEMO_SQUADS: Record<string, string[]> = {
  'Brésil':    ['G. Almeida', 'R. Castro', 'D. Souza', 'P. Lima'],
  'Allemagne': ['T. Keller', 'M. Hartmann', 'F. Wagner', 'L. Schubert'],
};

function pickRandomPlayer(teamName: string): string | null {
  const squad = DEMO_SQUADS[teamName];
  if (!squad?.length) return null;
  return squad[Math.floor(Math.random() * squad.length)];
}

const rawMockMatches: Match[] = JSON.parse(fs.readFileSync(config.mockFile, 'utf-8'));
let mockMatches: Match[] = rawMockMatches.map((m) => ({ ...m, id: String(m.id) }));

function simulateLiveTick(): void {
  for (const match of mockMatches) {
    if (match.status !== 'LIVE' || match.minute >= 90) continue;

    match.minute += 1;

    if (Math.random() < 0.08) {
      const scorer  = Math.random() < 0.5 ? match.homeTeam : match.awayTeam;
      const scorer2 = Math.random() < 0.5 ? match.homeTeam : match.awayTeam;
      const player  = pickRandomPlayer(scorer);
      const assist  = player && scorer2 === scorer && Math.random() < 0.6
        ? pickRandomPlayer(scorer)
        : null;
      const penalty = !assist && Math.random() < 0.15;

      match.events ??= [];
      match.events.push({
        minute:  match.minute,
        type:    'GOAL',
        team:    scorer,
        player:  player ?? null,
        penalty,
      });

      if (scorer === match.homeTeam) {
        match.homeScore += 1;
      } else {
        match.awayScore += 1;
      }
    }

    if (match.minute >= 90) match.status = 'FINISHED';
  }
}

setInterval(simulateLiveTick, 15_000);

export function getMockMatches(): Match[] {
  return mockMatches;
}
