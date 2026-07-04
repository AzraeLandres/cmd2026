import { callGroqAPI } from '../lib/groq';
import { getMatches } from '../lib/football';
import { GraphQLContext } from '../types';
import { GraphQLError } from 'graphql';

const SYSTEM_PROMPT = `Tu es un assistant expert en football pour la Coupe du Monde 2026.
Tu réponds en français de façon concise et précise.
Tu as accès à la liste des matchs de la compétition (à venir, en direct ou terminés) fournie ci-dessous pour répondre aux questions.
Si un match demandé n'apparaît pas dans cette liste, dis clairement que tu n'as pas cette information plutôt que d'inventer un résultat.
Ne fournis pas d'informations inventées — si tu ne sais pas, dis-le clairement.`;

export const chatResolvers = {
  Mutation: {
    async sendChatMessage(_: unknown, args: { message: string }, ctx: GraphQLContext): Promise<string> {
      if (!ctx.user) throw new GraphQLError('Connexion requise', { extensions: { code: 'UNAUTHENTICATED' } });

      let matchContext = '';
      try {
        const matches = await getMatches();
        if (matches.length > 0) {
          matchContext = '\n\nMatchs de la compétition (statut, score, minute si en direct) :\n' + matches
            .map((m) => {
              const scoreOrStatus =
                m.status === 'LIVE'      ? `${m.homeScore}-${m.awayScore} (${m.minute}', en direct)` :
                m.status === 'FINISHED'  ? `${m.homeScore}-${m.awayScore} (terminé)` :
                m.status === 'SCHEDULED' ? `pas encore joué${m.date ? ` (${m.date})` : ''}` :
                m.status.toLowerCase();
              return `${m.homeTeam} vs ${m.awayTeam} : ${scoreOrStatus}`;
            })
            .join('\n');
        }
      } catch {
        // données de match non critiques pour la réponse du chatbot
      }

      return callGroqAPI(SYSTEM_PROMPT + matchContext, [
        { role: 'user', content: args.message },
      ]);
    },
  },
};
