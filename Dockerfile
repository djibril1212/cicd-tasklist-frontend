# syntax=docker/dockerfile:1

###############################################
# Stage 1 — Build de l'application (Vite)
###############################################
FROM node:20-alpine AS builder

WORKDIR /app

# Installation des dépendances (avec devDependencies pour vite & tsc)
COPY package.json package-lock.json ./
RUN npm ci

# Code source + build de production -> dist/
COPY . .
RUN npm run build

###############################################
# Stage 2 — Service statique via Nginx (non-root)
###############################################
FROM nginxinc/nginx-unprivileged:alpine AS runner

# Mise à jour des paquets OS pour corriger les CVE de l'image de base
USER root
RUN apk upgrade --no-cache
USER nginx

# Config Nginx (SPA + proxy /api, écoute sur 8080 en non-root)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fichiers statiques compilés
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

# L'image de base démarre déjà nginx en avant-plan en tant qu'utilisateur non-root (uid 101)
