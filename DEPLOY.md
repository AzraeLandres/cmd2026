# Déploiement VPS — CDM 2026 Tracker

## Pré-requis sur le VPS

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # se reconnecter après
```

## 1. Envoyer le projet sur le VPS

**Option A — Git (recommandé)**

```bash
# Sur le VPS
git clone <url-de-ton-dépôt> /opt/cdm2026
cd /opt/cdm2026/prototype
```

## 2. Configurer les variables d'environnement

```bash
cd /opt/cdm2026/prototype
cp .env.example .env
nano .env   # remplir PG_PASSWORD, TOKEN_SECRET, et les clés API
```

Générer un TOKEN_SECRET sécurisé :

```bash
openssl rand -hex 32
```

## 3. Lancer les conteneurs

```bash
docker compose up -d --build
```

Vérifier que tout tourne :

```bash
docker compose ps
docker compose logs app --tail=30
```

L'application est accessible sur **http://ip-du-vps**

## 4. HTTPS

Géré par Caddy en amont sur le VPS (certificats Let's Encrypt automatiques) — rien à configurer côté application. Caddy doit proxifier vers `http://localhost:3001`.

## 5. Mettre à jour l'application

```bash
cd /opt/cdm2026/prototype
bash deploy.sh
```

## Commandes utiles

```bash
docker compose logs -f app          # logs en temps réel
docker compose exec db psql -U cdm -d cdm2026  # console PostgreSQL
docker compose down                 # arrêter tout
docker compose down -v              # arrêter + supprimer les données PG
```
