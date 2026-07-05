# CDM 2026 — Application de suivi & paris

Application web mobile-first permettant de suivre les matchs de la Coupe du Monde 2026, de parier sur les scores avec ses amis et de consulter un classement en temps réel.

Projet réalisé dans le cadre d'une soutenance de Master 1.

## Fonctionnalités

- **Suivi des matchs** : scores en direct, compositions d'équipe, événements (buts, cartons), minute en direct
- **Deux sources de données** : API [football-data.org](https://www.football-data.org/) si une clé est configurée, sinon bascule automatique sur un jeu de données simulées (mode démo) avec matchs en direct qui évoluent en temps réel
- **Paris entre amis** : pronostics sur chaque match, visibles uniquement entre amis (pas de fuite vers des inconnus), classement par points (score exact = 3 pts, vainqueur correct = 1 pt)
- **Système d'amis** : recherche par pseudo, demandes envoyées/reçues distinctes, acceptation/suppression
- **Gestion de compte** : inscription, connexion, suppression de compte (cascade sur les données associées)
- **Équipes favorites** : synchronisées en base de données (multi-appareils), avec migration automatique des favoris précédemment stockés en local
- **Chatbot** : assistant intégré (Llama 3.3 70B via Groq), contextualisé avec le calendrier réel des matchs
- **Rafraîchissement automatique** : scores, minute en direct et paris mis à jour sans avoir à recharger la page
- **Rate limiting** : protection basique sur la connexion, l'inscription et le chatbot

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Front-end | React 18, Vite, React Router, Apollo Client, Tailwind CSS v4 |
| Back-end | Node.js, TypeScript, Express, Apollo Server (GraphQL) |
| Base de données | PostgreSQL |
| Auth | HMAC-SHA256 (tokens) + scrypt (mots de passe), natif Node.js — aucune dépendance externe |
| Déploiement | Docker, Docker Compose, Caddy (reverse proxy + HTTPS, configuré sur le VPS en dehors de ce dépôt) |
| CI/CD | GitHub Actions |

## Architecture

```
├── src/                    # Back-end (API GraphQL)
│   ├── server.ts           # Point d'entrée Express + Apollo Server
│   ├── schema.ts           # Schéma GraphQL (typeDefs)
│   ├── resolvers/          # Resolvers Query/Mutation (auth, bets, friends, favorites, football, chat)
│   ├── lib/                # Modules (auth, db, football, groq, rateLimit, demo…)
│   └── types/              # Types partagés back-end
│
├── react-app/              # Front-end React
│   └── src/
│       ├── atoms/          # Composants de base (Chip, EmptyState, SectionTitle…)
│       ├── molecules/      # Composants composés (MatchCard, EventRow…)
│       ├── organisms/      # Blocs fonctionnels (BottomNav, ChatBot, FriendsSection…)
│       ├── pages/          # Pages de l'application
│       ├── context/        # Contextes React (Auth, Profile, Header)
│       ├── graphql/        # Queries/mutations Apollo
│       ├── interfaces/     # Types TypeScript partagés (Match, Bet, Friend…)
│       └── utils/          # Fonctions utilitaires (classes Tailwind partagées, helpers)
│
├── data/                   # Données mock (mode démo) et schéma SQL de référence
└── test/                   # Tests unitaires (Node:test natif)
```

## Installation

### Prérequis

- Node.js 22+
- PostgreSQL 16+ (requis pour l'authentification, les paris, les amis et les favoris ; sans base configurée, seule la consultation des matchs — en mode démo — reste disponible)
- Docker & Docker Compose (pour la production)

### Développement local

```bash
# Back-end
cp .env.example .env   # renseigner les variables
npm install
npm run dev             # démarre le serveur GraphQL avec rechargement à chaud (tsx watch)

# Front-end (dans un second terminal)
cd react-app
npm install
npm run dev             # démarre Vite (proxy /graphql vers localhost:3000)
```

L'API GraphQL est disponible sur `http://localhost:3000/graphql`, le front sur `http://localhost:5173`.

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `PORT` | Port du serveur (défaut : 3000) |
| `FOOTBALL_DATA_API_KEY` | Clé API football-data.org v4 (optionnelle — sans elle, mode démo) |
| `GROQ_API_KEY` | Clé API Groq (chatbot) |
| `TOKEN_SECRET` | Secret HMAC pour les tokens d'auth — générer avec `openssl rand -hex 32` |
| `DATABASE_URL` | DSN PostgreSQL complet, **ou** définir `PG_HOST` / `PG_PORT` / `PG_DB` / `PG_USER` / `PG_PASSWORD` séparément (utilisé par Docker Compose) |

### Production (Docker)

```bash
docker compose up -d --build
```

L'application est exposée sur le port 3001. En production, un reverse proxy Caddy (configuré directement sur le VPS, hors de ce dépôt) gère le HTTPS et redirige vers ce port.

## Tests

```bash
npm test
```

Compile le TypeScript puis exécute les tests unitaires (`node:test`) sur les modules d'authentification (hachage scrypt, tokens HMAC) et les utilitaires HTTP (validation d'identifiants, lecture de body).

## CI/CD

Chaque push sur la branche `dev` déclenche (`.github/workflows/ci.yml`) :
1. Les tests unitaires back-end (compilation TypeScript incluse)
2. Le build du front-end React (détection d'erreurs de compilation)
3. Si tout passe : merge automatique `dev → main` puis déploiement sur le VPS (copie des fichiers + rebuild des conteneurs Docker)
