#!/usr/bin/env bash
# deploy.sh — Déploiement / mise à jour sur VPS
# Usage : bash deploy.sh
set -euo pipefail

echo ">>> Mise à jour du code"
git pull origin main

echo ">>> Build et redémarrage des conteneurs"
docker compose build --no-cache
docker compose up -d --remove-orphans

echo ">>> Nettoyage des images obsolètes"
docker image prune -f

echo ""
echo "Déploiement terminé."
docker compose ps
