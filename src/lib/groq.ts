import https from 'https';
import { config } from './config';
import { ChatMessage } from '../types';

// Modèle "compound" : recherche web intégrée (via l'outil de recherche de Groq),
// utile pour répondre avec de vraies infos à jour plutôt que le seul entraînement du modèle.
const GROQ_MODEL    = 'groq/compound-mini';
const GROQ_MAX_TOKENS = 512;
const GROQ_TIMEOUT_MS = 30_000;

export function callGroqAPI(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const payload = JSON.stringify({
    model:      GROQ_MODEL,
    max_tokens: GROQ_MAX_TOKENS,
    messages:   [{ role: 'system', content: systemPrompt }, ...messages],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.groq.com',
        path:     '/openai/v1/chat/completions',
        method:   'POST',
        headers:  {
          Authorization:    `Bearer ${config.groqApiKey}`,
          'content-type':   'application/json',
          'content-length': Buffer.byteLength(payload),
        },
        timeout: GROQ_TIMEOUT_MS,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            const message = json.choices?.[0]?.message?.content;
            if (message) return resolve(message);
            if (json.error) return reject(new Error(json.error.message ?? 'Erreur API Groq'));
            reject(new Error('Réponse inattendue de l\'API Groq'));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Timeout Groq')));
    req.write(payload);
    req.end();
  });
}
