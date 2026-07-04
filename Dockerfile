FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci
COPY src/ ./src/
RUN npx tsc

FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY react-app/package*.json ./
RUN npm ci
COPY react-app/ ./
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder          /app/node_modules    ./node_modules
COPY --from=builder          /app/dist            ./dist
COPY --from=frontend-builder /frontend/dist       ./public
COPY mock-matches.json ./

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
