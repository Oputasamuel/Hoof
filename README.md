# HOOF

HOOF is a social-first arcade horse-racing game built with Decentraland SDK7. Players race three-lap obstacle circuits, manage stamina, jump hurdles, complete rotating daily objectives, grow a persistent royal stable, and cooperate through the Crown Bond formation mechanic.

This repository is the working game project for the Decentraland Creator Success V0 application.

## Play the test scene

- **World:** `hoof.dcl.eth`
- **Open in Decentraland:** [Enter the HOOF World](https://decentraland.org/jump?realm=hoof.dcl.eth)
- **Game Design Document:** [design/gdd.md](design/gdd.md)

The deployed scene is a test build. Multiplayer, mobile performance, persistence and balancing remain active validation work, as documented in the GDD.

## Player promise

> You are a royal stable racer. Master a horse across obstacle-filled circuits while nearby teammates turn close formation into shared racing power.

## Current playable systems

- Three-lap races with a six-horse field
- Same-realm player synchronization with AI-filled solo races
- Gold Stable and Purple Stable team assignment
- Crown Bond proximity mechanic and synchronized-jump bonus
- Gradual sprint acceleration, stamina drain and recovery
- Jumpable hurdles, collision penalties and imperfect AI rivals
- Touch and desktop controls with a third-person camera
- Persistent local horseshoes, stable XP and horse collection
- A 28-day check-in calendar with horse milestones
- Twenty daily objectives selected from a bank of 100
- Permanent cumulative leaderboard points
- Royal countryside stadium, spectators, ambient horses and audio

## Controls

| Action | Desktop | Touch |
|---|---|---|
| Steer | A/D or arrow keys | Left/right buttons |
| Sprint | Hold W | Hold sprint icon |
| Jump | Space | Tap jump icon |
| Camera | Secondary action / HUD | Camera button |
| Menu | U / HUD | Menu button |

## Social loop

Players meet in the paddock, ready for the same heat and are assigned to Gold or Purple Stable. Riding close to a teammate builds Crown Bond; synchronized jumps build it faster. Active Bond reduces stamina drain, creating a repeated decision between holding formation for shared efficiency and breaking away for a faster individual racing line. Team finishing positions determine the stable result when enough human racers are present.

Solo play remains available through AI opponents, tasks and progression, but Crown Bond, human rivalry, team results and partner continuity only exist when other players participate.

## Return and progression loop

- Race finishes grant horseshoes and stable XP.
- Daily objectives grant progression rewards and permanent rank points.
- The daily board changes; the cumulative leaderboard does not reset.
- A 28-day calendar previews future rewards and unlocks horses on milestone days.
- Horse variants express status but do not provide paid or permanent speed power.
- There is no wagering, real-money horse purchase, token reward or cash-out system.

## Run locally

### Creator Hub

1. Install [Decentraland Creator Hub](https://decentraland.org/download/creator-hub).
2. Clone or download this repository.
3. Import the repository folder from Creator Hub's **Scenes** tab.
4. Open the scene and press **Play**.

### Command line

```bash
npm install
npm run start
```

Type-check the project with:

```bash
npx tsc --noEmit
```

## Authoritative persistence backend

The scene includes a PostgreSQL-ready service in [`backend/`](backend/) using Decentraland Signed Fetch identity. It owns daily claims, horse purchases, race rewards, task points, cross-device progression and the permanent global leaderboard. Local storage remains an offline preview fallback, but it cannot overwrite an existing server record.

See [backend/README.md](backend/README.md) for testing and deployment. A published build requires an HTTPS deployment, PostgreSQL and an update to `HOOF_BACKEND_URL` in `src/game/backend.ts`.

## Repository structure

| Path | Purpose |
|---|---|
| `src/` | SDK7 gameplay, UI, multiplayer, progression and audio code |
| `assets/` | Models, textures, UI sprites, audio and thumbnail assets |
| `design/gdd.md` | Creator Success Game Design Document |
| `backend/` | Authoritative Signed Fetch progression and leaderboard service |
| `main.crdt` | Creator Hub scene composition |
| `scene.json` | Scene and World metadata |
| `THIRD_PARTY_ASSETS.md` | Third-party asset source and licence notes |

## Project status

This is a playable test scene, not a claimed finished product. The V0 plan focuses on structured multiplayer testing, the 5/10 onboarding test, mobile performance, authoritative persistence, abuse resistance, accessibility and final third-party licence evidence.

## Third-party assets

Third-party asset information is recorded in [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md). Before a funded or commercial release, the project will retain a complete evidence folder containing the licence text or screenshot, source URL, author, imported files and any required attribution for every model, audio track, font and generated asset.

Unless a file states otherwise, no licence is granted for reuse of the original HOOF project content. Third-party assets remain subject to their respective owners' terms.
