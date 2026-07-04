# CDM 2026 — Application de suivi & paris

Application web mobile-first permettant de suivre les matchs de la Coupe du Monde 2026, de parier sur les scores avec ses amis et de consulter un classement en temps réel.

## Fonctionnalités

- **Suivi des matchs** : scores en direct, compositions d'équipe, événements (buts, cartons)
- **Paris entre amis** : pronostics sur chaque match, classement par points (score exact = 3 pts, vainqueur correct = 1 pt)
- **Gestion de compte** : inscription, connexion, profil, équipes favorites
- **Système d'amis** : recherche d'utilisateurs, demandes d'amitié, liste d'amis
- **Chatbot** : assistant intégré basé sur Llama 3.3 70B (Groq)
- **Temps réel** : mise à jour automatique des scores et des paris toutes les 5 secondes

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Front-end | React 18, Vite, React Router |
| Back-end | Node.js (HTTP natif, zéro framework) |
| Base de données | PostgreSQL |
| Auth | HMAC-SHA256 + scrypt (natif Node.js) |
| Déploiement | Docker, Docker Compose, Caddy |
| CI/CD | GitHub Actions |

## Architecture

```
├── lib/          # Modules back-end (auth, db, football, http…)
├── routes/       # Handlers API (auth, bets, friends, football, chat)
├── react-app/    # Front-end React
│   └── src/
│       ├── atoms/        # Composants de base
│       ├── molecules/    # Composants composés
│       ├── organisms/    # Blocs fonctionnels
│       └── pages/        # Pages de l'application
├── data/         # Données mock et schéma SQL
└── test/         # Tests unitaires (Node:test natif)
```

## Installation

### Prérequis

- Node.js 22+
- PostgreSQL 16+
- Docker & Docker Compose (pour la production)

### Développement local

```bash
# Back-end
cp .env.example .env   # renseigner les variables
npm install
node server.js

# Front-end (dans un second terminal)
cd react-app
npm install
npm run dev
```

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `PORT` | Port du serveur (défaut : 3000) |
| `FOOTBALL_DATA_API_KEY` | Clé API football-data.org v4 |
| `GROQ_API_KEY` | Clé API Groq (chatbot) |
| `TOKEN_SECRET` | Secret HMAC pour les tokens d'auth |
| `DATABASE_URL` | DSN PostgreSQL |

### Production (Docker)

```bash
docker compose up -d --build
```

L'application est exposée sur le port 3001, derrière un reverse proxy Caddy gérant le SSL.

## Tests

```bash
npm test
```

Les tests couvrent les modules d'authentification (hachage scrypt, tokens HMAC) et les utilitaires HTTP.

## CI/CD

Chaque push sur la branche `dev` déclenche :
1. Les tests unitaires back-end
2. Le build React (détection d'erreurs de compilation)
3. Si tout passe : merge automatique vers `main` et déploiement sur le VPS
