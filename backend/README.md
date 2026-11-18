# HOOF backend

This service stores game state under the wallet address recovered from Decentraland Signed Fetch headers. It never trusts an address supplied by the scene.

## Local preview

1. Run `npm install` in this folder.
2. Run `npm start`.
3. Preview HOOF in Creator Hub. The scene client is configured for `http://127.0.0.1:8787`.

## Production

Deploy this folder as a persistent Node.js service with HTTPS and mount persistent storage at `/app/data`. Then replace `HOOF_BACKEND_URL` in `src/game/backend.ts` with its HTTPS URL before publishing the scene.

The service exposes `GET /health`, authenticated `GET/PUT /v1/state`, and authenticated `GET /v1/leaderboard`. Local cached progress is uploaded automatically the first time a wallet connects and has no server record.
