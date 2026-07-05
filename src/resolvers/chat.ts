import { callGroqAPI } from '../lib/groq';
import { getMatches } from '../lib/football';
import { isRateLimited } from '../lib/rateLimit';
import { GraphQLContext, Match } from '../types';
import { GraphQLError } from 'graphql';

const SYSTEM_PROMPT = `Tu es un assistant expert en football pour la Coupe du Monde 2026.
Tu réponds en français de façon concise et précise.
Tu as accès à la liste des matchs suivis par l'application (à venir, en direct ou terminés) fournie ci-dessous : utilise-la en priorité pour toute question sur ces matchs précis, c'est la source la plus fiable pour ce qui concerne l'application.
Pour toute autre question d'actualité (autres résultats, informations générales sur la compétition, équipes, joueurs…), utilise la recherche web pour donner une réponse à jour plutôt que de te fier uniquement à tes connaissances.
Ne fournis jamais d'informations inventées — si tu ne trouves rien de fiable, dis-le clairement.`;

const CHAT_LIMIT        = 20;
const CHAT_WINDOW_MS    = 10 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 500;
const MAX_CONTEXT_MATCHES = 20;

function formatMatch(m: Match): string {
  const scoreOrStatus =
    m.status === 'LIVE'      ? `${m.homeScore}-${m.awayScore} (${m.minute}', en direct)` :
    m.status === 'FINISHED'  ? `${m.homeScore}-${m.awayScore} (terminé)` :
    m.status === 'SCHEDULED' ? `pas encore joué${m.date ? ` (${m.date})` : ''}` :
    m.status.toLowerCase();
  return `${m.homeTeam} vs ${m.awayTeam} : ${scoreOrStatus}`;
}

// Borne la taille du contexte envoyé au LLM même pour un vrai calendrier (~104 matchs) :
// priorité aux matchs cités dans le message, puis aux matchs en direct, puis aux plus proches dans le temps.
function selectRelevantMatches(matches: Match[], message: string): Match[] {
  if (matches.length <= MAX_CONTEXT_MATCHES) return matches;

  const lowerMessage = message.toLowerCase();
  const mentioned = matches.filter(
    (m) => lowerMessage.includes(m.homeTeam.toLowerCase()) || lowerMessage.includes(m.awayTeam.toLowerCase()),
  );
  const live = matches.filter((m) => m.status === 'LIVE');
  const now = Date.now();
  const byProximity = [...matches].sort(
    (a, b) => Math.abs(new Date(a.date).getTime() - now) - Math.abs(new Date(b.date).getTime() - now),
  );

  const selected = new Map<string, Match>();
  for (const m of [...mentioned, ...live, ...byProximity]) {
    if (selected.size >= MAX_CONTEXT_MATCHES) break;
    selected.set(m.id, m);
  }
  return Array.from(selected.values());
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
        const relevant = selectRelevantMatches(matches, message);
        if (relevant.length > 0) {
          matchContext = '\n\nMatchs de la compétition (statut, score, minute si en direct) :\n'
            + relevant.map(formatMatch).join('\n');
        }
      } catch {
        // données de match non critiques pour la réponse du chatbot
      }

      return callGroqAPI(SYSTEM_PROMPT + matchContext, [
        { role: 'user', content: message },
      ]);
    },
  },
};
