import { callGroqAPI } from '../lib/groq';
import { getMatches } from '../lib/football';
import { isRateLimited } from '../lib/rateLimit';
import { GraphQLContext, Match } from '../types';
import { GraphQLError } from 'graphql';

const SYSTEM_PROMPT = `Tu es un assistant expert en football pour la Coupe du Monde 2026.
Tu réponds en français de façon concise et précise.
Tu as accès à la liste des matchs suivis par l'application (à venir, en direct ou terminés) fournie ci-dessous, avec la date et l'heure actuelles : utilise-la en priorité pour toute question sur ces matchs précis, c'est la source la plus fiable pour ce qui concerne l'application.
Les sections "Matchs récents" et "Prochains matchs" sont déjà triées chronologiquement (la plus récente/proche en premier) — fie-toi à cet ordre plutôt que de recalculer les dates toi-même.
Pour toute autre question d'actualité (autres résultats, informations générales sur la compétition, équipes, joueurs…), utilise la recherche web pour donner une réponse à jour plutôt que de te fier uniquement à tes connaissances.
Ne fournis jamais d'informations inventées — si tu ne trouves rien de fiable, dis-le clairement.`;

const CHAT_LIMIT        = 20;
const CHAT_WINDOW_MS    = 10 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 500;
const MAX_MATCHES_PER_SECTION = 10;

function formatMatch(m: Match): string {
  const scoreOrStatus =
    m.status === 'LIVE'      ? `${m.homeScore}-${m.awayScore} (${m.minute}', en direct)` :
    m.status === 'FINISHED'  ? `${m.homeScore}-${m.awayScore} (terminé)` :
    m.status === 'SCHEDULED' ? `pas encore joué${m.date ? ` (${m.date})` : ''}` :
    m.status.toLowerCase();
  return `${m.homeTeam} vs ${m.awayTeam} : ${scoreOrStatus}`;
}

function hasAssignedTeams(m: Match): boolean {
  return Boolean(m.homeTeam.trim()) && Boolean(m.awayTeam.trim());
}

function formatSection(title: string, matches: Match[]): string {
  if (matches.length === 0) return '';
  return `\n\n${title} :\n` + matches.map(formatMatch).join('\n');
}

// Construit un contexte explicitement trié et daté (plutôt qu'une simple liste plate) :
// le modèle n'a pas à recalculer lui-même quel match est "le plus récent" ou "le prochain".
function buildMatchContext(matches: Match[], message: string): string {
  const lowerMessage = message.toLowerCase();
  const mentioned = matches.filter(
    (m) => lowerMessage.includes(m.homeTeam.toLowerCase()) || lowerMessage.includes(m.awayTeam.toLowerCase()),
  );
  const live = matches.filter((m) => m.status === 'LIVE');

  const recentFinished = matches
    .filter((m) => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, MAX_MATCHES_PER_SECTION);

  const upcoming = matches
    .filter((m) => m.status === 'SCHEDULED' && hasAssignedTeams(m))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, MAX_MATCHES_PER_SECTION);

  return (
    `\n\nDate et heure actuelles : ${new Date().toISOString()}`
    + formatSection('Matchs mentionnés dans la question', mentioned)
    + formatSection('Matchs en direct', live)
    + formatSection('Matchs récents (du plus récent au plus ancien)', recentFinished)
    + formatSection('Prochains matchs (du plus proche au plus lointain)', upcoming)
  );
}

export const chatResolvers = {
  Mutation: {
    async sendChatMessage(_: unknown, args: { message: string }, ctx: GraphQLContext): Promise<string> {
      if (!ctx.user) throw new GraphQLError('Connexion requise', { extensions: { code: 'UNAUTHENTICATED' } });

      if (isRateLimited(`chat:${ctx.user.id}`, CHAT_LIMIT, CHAT_WINDOW_MS)) {
        throw new GraphQLError('Trop de messages envoyés, réessayez dans quelques minutes', {
          extensions: { code: 'RATE_LIMITED' },
        });
      }

      const message = args.message.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!message) throw new GraphQLError('Message vide');

      let matchContext = '';
      try {
        const matches = await getMatches();
        matchContext = buildMatchContext(matches, message);
      } catch {
        // données de match non critiques pour la réponse du chatbot
      }

      return callGroqAPI(SYSTEM_PROMPT + matchContext, [
        { role: 'user', content: message },
      ]);
    },
  },
};
