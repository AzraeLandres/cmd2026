import https from 'https';
import { IncomingMessage } from 'http';
import { config } from './config';
import { getMockMatches } from './demo';
import { enrichMatchWithOpenFootball } from './openfootball';
import { Match, MatchStatus } from '../types';

const VALID_PHASES = new Set([
  'GROUP_STAGE', 'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL',
]);

const LIST_CACHE_TTL_MS   = 20_000;
const DETAIL_CACHE_TTL_MS = 10_000;

let listCache: { data: Match[] | null; fetchedAt: number } = { data: null, fetchedAt: 0 };
const detailCache = new Map<string, { data: Match; fetchedAt: number }>();

function fetchJson<T>(hostname: string, urlPath: string, headers: Record<string, string> = {}): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path:    urlPath,
        method:  'GET',
        headers: { 'User-Agent': 'cdm2026-tracker/1.0', ...headers },
        timeout: 8000,
      },
      (res: IncomingMessage) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode === 404) return resolve(null);
          if (res.statusCode === 429) return reject(new Error('Quota API dépassé (429)'));
          if (res.statusCode !== 200)  return reject(new Error(`HTTP ${res.statusCode}`));
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Timeout requête football-data')));
    req.end();
  });
}

function normalizeStatus(rawStatus: string): MatchStatus {
  if (rawStatus === 'IN_PLAY' || rawStatus === 'PAUSED' || rawStatus === 'LIVE') return 'LIVE';
  if (rawStatus === 'FINISHED' || rawStatus === 'AWARDED') return 'FINISHED';
  if (rawStatus === 'SCHEDULED' || rawStatus === 'TIMED')  return 'SCHEDULED';
  if (rawStatus === 'POSTPONED') return 'POSTPONED';
  if (rawStatus === 'SUSPENDED') return 'SUSPENDED';
  if (rawStatus === 'CANCELLED') return 'CANCELED';
  return 'SCHEDULED';
}

// L'API football-data.org (offre gratuite) ne fournit pas la minute en direct :
// on l'estime à partir de l'heure de coup d'envoi quand elle est absente.
function resolveMinute(status: MatchStatus, providedMinute: unknown, utcDate: string): number {
  if (typeof providedMinute === 'number' && providedMinute > 0) return providedMinute;
  if (status !== 'LIVE' || !utcDate) return 0;

  const elapsed = Math.floor((Date.now() - new Date(utcDate).getTime()) / 60_000);
  return Math.min(90, Math.max(0, elapsed));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMatchList(matches: any[]): Match[] {
  return matches.map((m) => {
    const status = normalizeStatus(m.status);
    return {
      id:        String(m.id),
      homeTeam:  m.homeTeam?.name ?? '',
      awayTeam:  m.awayTeam?.name ?? '',
      homeScore: m.score?.fullTime?.home ?? 0,
      awayScore: m.score?.fullTime?.away ?? 0,
      status,
      minute:    resolveMinute(status, m.minute, m.utcDate),
      phase:     m.stage,
      stage:     m.stage,
      venue:     m.venue ?? '',
      date:      m.utcDate,
      events:    [],
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMatchDetail(m: any): Match {
  const events = [
    ...(m.goals ?? []).map((g: any) => ({
      minute:      g.minute,
      type:        'GOAL',
      team:        g.team?.name ?? '',
      player:      g.scorer?.name ?? null,
      assistPlayer: g.assist?.name ?? null,
      penalty:     g.type === 'PENALTY',
    })),
    ...(m.bookings ?? []).map((b: any) => ({
      minute: b.minute,
      type:   b.card === 'RED' || b.card === 'RED_CARD' ? 'RED_CARD' : 'YELLOW_CARD',
      team:   b.team?.name ?? '',
      player: b.player?.name ?? null,
    })),
  ];

  const status = normalizeStatus(m.status);
  return {
    id:        String(m.id),
    homeTeam:  m.homeTeam?.name ?? '',
    awayTeam:  m.awayTeam?.name ?? '',
    homeScore: m.score?.fullTime?.home ?? 0,
    awayScore: m.score?.fullTime?.away ?? 0,
    status,
    minute:    resolveMinute(status, m.minute, m.utcDate),
    phase:     m.stage,
    stage:     m.stage,
    venue:     m.venue ?? '',
    date:      m.utcDate,
    events,
    lineups: {
      home: m.homeTeam?.lineup?.map((p: any) => p.name) ?? [],
      away: m.awayTeam?.lineup?.map((p: any) => p.name) ?? [],
    },
  };
}

async function fetchMatchListWithCache(): Promise<Match[]> {
  const now = Date.now();
  if (listCache.data && now - listCache.fetchedAt < LIST_CACHE_TTL_MS) return listCache.data;

  const json = await fetchJson<{ matches: unknown[] }>(
    'api.football-data.org',
    '/v4/competitions/WC/matches',
    { 'X-Auth-Token': config.footballApiKey }
  );

  const data = normalizeMatchList(json?.matches ?? []);
  listCache = { data, fetchedAt: now };
  return data;
}

async function fetchMatchDetailWithCache(id: string): Promise<Match | null> {
  const now    = Date.now();
  const cached = detailCache.get(id);
  if (cached && now - cached.fetchedAt < DETAIL_CACHE_TTL_MS) return cached.data;

  const raw = await fetchJson<unknown>(
    'api.football-data.org',
    `/v4/matches/${encodeURIComponent(id)}`,
    { 'X-Auth-Token': config.footballApiKey }
  );

  if (!raw) return null;
  const data = normalizeMatchDetail(raw);
  detailCache.set(id, { data, fetchedAt: now });
  return data;
}

export async function getMatches(): Promise<Match[]> {
  if (!config.footballApiKey) return getMockMatches();

  try {
    return await fetchMatchListWithCache();
  } catch (err) {
    console.error('[football-data liste indisponible]', (err as Error).message);
    return getMockMatches();
  }
}

export async function getMatchById(id: string): Promise<Match | null> {
  let match: Match | null;

  if (config.footballApiKey) {
    try {
      match = await fetchMatchDetailWithCache(id);
    } catch (err) {
      console.error('[football-data détail indisponible]', (err as Error).message);
      match = getMockMatches().find((m) => m.id === id) ?? null;
    }
  } else {
    match = getMockMatches().find((m) => m.id === id) ?? null;
  }

  if (!match) return null;
  return enrichMatchWithOpenFootball(match);
}

export { VALID_PHASES };
