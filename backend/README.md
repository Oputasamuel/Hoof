# HOOF authoritative backend

This service uses Decentraland Signed Fetch identity and stores each player's progression under the wallet address recovered from the signed headers. The scene never supplies or chooses its own wallet address.

## What the server owns

- Horseshoes, stable XP, owned horses and equipped horse
- One daily reward claim per UTC day and the 28-day reward cycle
- Daily task progress and permanent leaderboard points
- Short-lived race sessions and one-time race result submission
- Race rewards, task rewards, purchases and leaderboard ranking

The legacy `PUT /v1/state` route is import-only. It can create a first cloud record from an existing local save, but it cannot overwrite an existing server record.

## Local preview

```bash
npm install
npm test
npm start
```

Without `DATABASE_URL`, data is stored in `backend/data/players.json`. The scene currently points to `http://127.0.0.1:8787`.

## Production database

Create a PostgreSQL database and set:

```env
DATABASE_URL=postgresql://user:password@host:5432/hoof
PGSSL=require
PGSSL_REJECT_UNAUTHORIZED=false
```

Tables and indexes are created automatically at startup. JSON storage is intended only for local preview or a single persistent test container.

## Production deployment

1. Deploy this folder as a Node 20 service or use the included Dockerfile.
2. Configure `DATABASE_URL` and HTTPS.
3. Confirm `GET /health` returns `authoritative: true` and `storage: postgres`.
4. Replace `HOOF_BACKEND_URL` in `src/game/backend.ts` with the HTTPS service URL.
5. Rebuild and publish the scene.

The service must remain behind HTTPS for published Decentraland clients. Keep one application instance for the first release; horizontal scaling should add database-level per-player transaction locking.

## API

All `/v1/*` routes require valid Decentraland Signed Fetch headers.

- `GET /v1/state` — load authoritative state
- `PUT /v1/state` — one-time local-save import only
- `POST /v1/daily/claim` — server-time daily reward
- `POST /v1/horses/:id/purchase` — server-priced purchase
- `POST /v1/horses/:id/equip` — equip an owned horse
- `POST /v1/races/start` — issue a one-use race session
- `POST /v1/races/:id/finish` — validate and reward a result
- `GET /v1/leaderboard` — permanent global ranking

Run `npm run check` and `npm test` before deployment.
