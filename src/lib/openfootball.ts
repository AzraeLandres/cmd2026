import https from 'https';
import { IncomingMessage } from 'http';
import { Match, MatchEvent } from '../types';

const CACHE_TTL_MS = 60 * 60 * 1000;

interface OpenFootballData {
  rounds?: Array<{
    matches?: Array<{
      team1?: { name?: string; code?: string };
      team2?: { name?: string; code?: string };
      goals1?: Array<{ minute?: number; name?: string; penalty?: boolean }>;
      goals2?: Array<{ minute?: number; name?: string; penalty?: boolean }>;
    }>;
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
  return na === nb || na.includes(nb) || nb.includes(na);
}

export async function enrichMatchWithOpenFootball(match: Match): Promise<Match> {
  if (match.status !== 'FINISHED' || (match.events && match.events.length > 0)) return match;

  const ofData = await getOpenFootballData();
  if (!ofData?.rounds) return match;

  for (const round of ofData.rounds) {
    for (const m of round.matches ?? []) {
      const team1Name = m.team1?.name ?? m.team1?.code ?? '';
      const team2Name = m.team2?.name ?? m.team2?.code ?? '';

      if (!teamNamesMatch(team1Name, match.homeTeam) || !teamNamesMatch(team2Name, match.awayTeam)) {
        continue;
      }

      const events: MatchEvent[] = [
        ...(m.goals1 ?? []).map((g) => ({
          minute:  g.minute ?? 0,
          type:    'GOAL' as const,
          team:    match.homeTeam,
          player:  g.name ?? null,
          penalty: !!g.penalty,
        })),
        ...(m.goals2 ?? []).map((g) => ({
          minute:  g.minute ?? 0,
          type:    'GOAL' as const,
          team:    match.awayTeam,
          player:  g.name ?? null,
          penalty: !!g.penalty,
        })),
      ];

      console.log(`[openfootball] ${match.homeTeam} vs ${match.awayTeam} — ${events.length} buts enrichis`);
      return { ...match, events };
    }
  }

  return match;
}
