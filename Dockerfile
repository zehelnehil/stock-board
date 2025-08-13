# Multi-stage build for client and server

# --- Client build ---
FROM node:20-alpine AS client-build
WORKDIR /app
COPY client/package.json client/package-lock.json* client/pnpm-lock.yaml* ./client/
RUN set -eux; \
  if [ -f client/pnpm-lock.yaml ]; then npm i -g pnpm; fi; \
  cd client; \
  if [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; elif [ -f package-lock.json ]; then npm ci; else npm i; fi
COPY client ./client
RUN cd client && npm run build

# --- Server stage ---
FROM node:20-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json ./server/package.json
RUN cd server && npm i --omit=dev
COPY server ./server
COPY --from=client-build /app/client/dist ./client/dist
EXPOSE 4000
CMD ["node", "server/src/index.js"]
