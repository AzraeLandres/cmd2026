import { callGroqAPI } from '../lib/groq';
import { getMatches } from '../lib/football';
import { GraphQLContext } from '../types';
import { GraphQLError } from 'graphql';

const SYSTEM_PROMPT = `Tu es un assistant expert en football pour la Coupe du Monde 2026.
Tu réponds en français de façon concise et précise.
Tu peux accéder aux données des matchs en cours pour répondre aux questions.
Ne fournis pas d'informations inventées — si tu ne sais pas, dis-le clairement.`;

export const chatResolvers = {
  Mutation: {
    async sendChatMessage(_: unknown, args: { message: string }, ctx: GraphQLContext): Promise<string> {
      if (!ctx.user) throw new GraphQLError('Connexion requise', { extensions: { code: 'UNAUTHENTICATED' } });

      let matchContext = '';
      try {
        const matches = await getMatches();
        const liveMatches = matches.filter((m) => m.status === 'LIVE');
        if (liveMatches.length > 0) {
          matchContext = '\n\nMatchs en direct : ' + liveMatches
            .map((m) => `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam} (${m.minute}')`)
            .join(', ');
        }
      } catch {
        // données en direct non critiques pour la réponse du chatbot
      }

      return callGroqAPI(SYSTEM_PROMPT + matchContext, [
        { role: 'user', content: args.message },
      ]);
    },
  },
};
