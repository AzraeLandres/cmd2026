import https from 'https';
import { IncomingMessage } from 'http';
import { Match, MatchEvent } from '../types';

const CACHE_TTL_MS = 60 * 60 * 1000;

interface OpenFootballGoal {
  name?:    string;
  minute?:  string | number;
  penalty?: boolean;
}

interface OpenFootballData {
  matches?: Array<{
    team1?:  string;
    team2?:  string;
    goals1?: OpenFootballGoal[];
    goals2?: OpenFootballGoal[];
  }>;
}

let cache: { data: OpenFootballData | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

function fetchOpenFootballJson(): Promise<OpenFootballData | null> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'raw.githubusercontent.com',
        path:     '/openfootball/worldcup.json/master/2026/worldcup.json',
        method:   'GET',
        headers:  { 'User-Agent': 'cdm2026-tracker/1.0' },
        timeout:  8000,
      },
      (res: IncomingMessage) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode === 404) return resolve(null);
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Timeout openfootball')));
    req.end();
  });
}

async function getOpenFootballData(): Promise<OpenFootballData | null> {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
  try {
    const data = await fetchOpenFootballJson();
    if (data) cache = { data, fetchedAt: now };
    return data ?? cache.data;
  } catch {
    return cache.data;
  }
}

function teamNamesMatch(a: string, b: string): boolean {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;

  // Gère les noms aux mots inversés (ex. "Congo DR" vs "DR Congo").
  const tokensA = na.split(/\s+/).sort().join(' ');
  const tokensB = nb.split(/\s+/).sort().join(' ');
  return tokensA === tokensB;
}

function parseMinute(minute: string | number | undefined): number {
  if (typeof minute === 'number') return minute;
  if (typeof minute === 'string') return parseInt(minute, 10) || 0;
  return 0;
}

export async function enrichMatchWithOpenFootball(match: Match): Promise<Match> {
  if (match.status !== 'FINISHED' || (match.events && match.events.length > 0)) return match;

  const ofData = await getOpenFootballData();
  if (!ofData?.matches) return match;

  for (const m of ofData.matches) {
    const team1Name = m.team1 ?? '';
    const team2Name = m.team2 ?? '';

    if (!teamNamesMatch(team1Name, match.homeTeam) || !teamNamesMatch(team2Name, match.awayTeam)) {
      continue;
    }

    const events: MatchEvent[] = [
      ...(m.goals1 ?? []).map((g) => ({
        minute:  parseMinute(g.minute),
        type:    'GOAL' as const,
        team:    match.homeTeam,
        player:  g.name ?? null,
        penalty: !!g.penalty,
      })),
      ...(m.goals2 ?? []).map((g) => ({
        minute:  parseMinute(g.minute),
        type:    'GOAL' as const,
        team:    match.awayTeam,
        player:  g.name ?? null,
        penalty: !!g.penalty,
      })),
    ];

    console.log(`[openfootball] ${match.homeTeam} vs ${match.awayTeam} — ${events.length} buts enrichis`);
    return { ...match, events };
  }

  return match;
}
