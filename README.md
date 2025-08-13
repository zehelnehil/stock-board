# Stock Market Dashboard

A full-stack stock market dashboard with a Node.js API and React frontend. Fetches live data from Yahoo Finance and visualizes it.

## Features
- Clean, responsive UI with company list and chart panel
- Live data via yahoo-finance2
- Local caching with sql.js (SQLite in WASM, persisted to file)
- 52-week high/low and average volume
- Vite + React + Chart.js on frontend
- Dockerfile and docker-compose for easy run

## Quick start (local)

### Prerequisites
- Node.js 18+ and npm

### Install and run
1. Server
   - Open a terminal in `server`
   - `npm install`
   - `npm run start`
2. Client
   - Open another terminal in `client`
   - `npm install`
   - `npm run dev`

Client runs on http://localhost:5173 and proxies to server http://localhost:4000.

## Docker
- Build and run both client + server in dev mode:
  - `docker compose up --build`
- Production image builds client and runs server: `docker build -t stock-dashboard .`

## Deploy (Render / Railway / Vercel)

### Render (Docker)
1. Push this repo to GitHub.
2. Create a new Web Service on Render, pick "Deploy from a repository".
3. Select this repo; Render will detect `render.yaml`.
4. First deploy will build the Dockerfile, expose port 4000. Health check uses `/health`.

### Railway (Docker)
1. `railway up` or create a project from the repo in the dashboard.
2. Choose Deploy via Dockerfile; set `PORT=4000` env var.

### Vercel (frontend only)
1. Deploy the `client` folder as a Vite project (Static).
2. Set Environment Variable: `VITE_API_BASE=https://<your-render-service>.onrender.com`.
3. Re-deploy; client will call your hosted API under `/api`.

### Render (API for split deploy)
1. Connect repo to Render (uses `render.yaml`).
2. Service type: Node. Build runs `cd server && npm install`. Start runs `cd server && node src/index.js`.
3. Set Environment Variable: `CORS_ORIGIN=https://<your-vercel-app>.vercel.app`.

## API
- `GET /api/companies` — list seeded companies
- `GET /api/prices/:symbol?range=6mo&interval=1d` — historical OHLCV + stats

## Tech
- Backend: Node.js, Express, yahoo-finance2, sql.js
- Frontend: React, Vite, Chart.js

## Notes
- Some environments may block outbound requests; if so, API falls back to cached DB if available.
- sql.js stores the DB under `server/data/stocks.sqlite`.

## Assignment blurb (200–300 words)
This project was built as a compact, production-leaning demo of a stock market dashboard. I started by defining a simple contract between frontend and backend: a company list endpoint and a historical prices endpoint. On the server, Express handles routing while yahoo-finance2 retrieves OHLCV data. I chose sql.js for zero-install persistence that behaves like SQLite but avoids native binaries; it caches fetched time series, enabling quick reloads and limited offline support.

The frontend uses Vite + React for fast iteration. The layout has a left sidebar with at least ten popular tickers and a main charting area. Chart.js (via react-chartjs-2) renders closing prices, and I added a few extras: range switching and derived stats like 52-week high/low and average volume. The UI stays intentionally clean and responsive.

For deployment, a Dockerfile multi-stage build compiles the client and packages the server for a single container. A compose file supports local dev with hot-reload. If hosted, one could deploy to Render or Railway by building the image or using their Node buildpacks.

Challenges included balancing simplicity with reliability: Yahoo’s free endpoints can rate-limit, and sql.js requires fetching its WASM in some contexts. The code guards for errors and uses a local cache fallback. Given more time, I’d add technical indicators, pagination for symbols, and a lightweight ML model for next-day predictions.
