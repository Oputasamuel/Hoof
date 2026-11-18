# HOOF — Game Design Document

**Decentraland Creator Success Program**

| | |
|---|---|
| **Public experience title** | **HOOF** — IP & [Content Policy](https://decentraland.org/content/) status: original game design and code owned by the creator; third-party horse models, music, sound effects, fonts, and source references require a final licence-evidence folder before submission. Name screening: concern found in a general web check on 18 November 2026 because “Hoof” and similar names are used by other horse games; final trademark/title clearance is `TBD:`. No gambling, wagering, paid horse purchase, or cash-out is designed. |
| **Deployment target** | Decentraland World: **hoof.dcl.eth** |
| **Studio / team name** | Zedef / HOOF — `TBD:` final studio name |
| **Date** | 18 November 2026 |
| **Contact (Discord + email)** | Discord: `TBD:` / Email: zedef0808@gmail.com |

---

## 0. TL;DR

| | |
|---|---|
| **Player promise** | You are a royal stable racer. Master a horse across obstacle-filled circuits while nearby teammates turn close formation into shared racing power. |
| **Primary player** | For players who enjoy accessible arcade racers and horse games, arriving alone or with friends, looking for a quick competitive race with persistent stable progression. |
| **Current status** | Playable vertical slice in Creator Hub, configured for **hoof.dcl.eth**: three-lap racing, six-horse field, AI rivals, touch/desktop controls, obstacles, daily tasks, check-in rewards, unlockable horses, local progression, same-realm multiplayer prototype, royal stadium, UI, and sound. Cloud persistence and production leaderboard service are coded as an optional prototype but are not deployed. |
| **Requested round** | V0: validate and harden the social racing and progression slice. |
| **Live at end of the round** | A player can enter HOOF alone or with others, complete a synchronized team or solo race, earn persistent stable rewards, pursue daily objectives, and return for named-rival ranking and horse unlocks. |

---

## 1. Player Promise

**One-line promise**

> You are a royal stable racer. Master a horse across obstacle-filled circuits while nearby teammates turn close formation into shared racing power.

**One familiar comparison**

It is an arcade horse racer with the instant readability of a kart race, but teammates who ride and jump together preserve stamina through **Crown Bond**.

**Why this game**

I want horse racing to feel immediate and social in Decentraland, rather than becoming another isolated time trial. HOOF combines the spectacle of a royal race day with a stable players gradually make their own through play, not real-money purchases.

---

## 2. First Minutes & How to Play

| Time | Player experience |
|---|---|
| **0–5 seconds after control** | You see the HOOF title, a large **START** button, a racing horse, and the royal track. If a daily reward is ready, its horse or horseshoe reward is shown as an optional claim, not a blocking tutorial. |
| **5–10 seconds** | You press **START** and enter the paddock. Your horse, the ready state, nearby racers, and the race entrance make the goal clear: ready up and finish three laps. |
| **10–60 seconds** | A short countdown places you behind your horse. Four large controls—left, right, sprint, and jump—frame the track. You accelerate, clear the first hurdle, hear the crowd, and see lap, position, time, stamina, and Crown Bond feedback. |
| **1–3 minutes** | You finish a three-lap race against players and/or AI. Results show position, time, team result, rewards, task progress, and any new stable milestone. |
| **3–10 minutes** | You inspect daily objectives, equip or work toward a horse, then choose another race. With another player, you decide whether to ride close for stamina efficiency or break formation to take the racing line. |
| **Natural stopping point** | Results and progression are saved. The final screen shows the next daily calendar reward, unfinished daily tasks, horseshoe balance, stable level, and the rival or rank immediately above you. |

**Player-facing How to Play**

- Steer, sprint, and jump through three laps.
- Finish high; complete tasks; grow your stable.
- Race together; build Crown Bond for stamina.

---

## 3. Core Loop

| # | Step (verb) | What the player does (Player input → what they see or hear → what changes) | Why do it again? |
|---|---|---|---|
| 1 | **Choose** | Claim an available reward, inspect three visible priority tasks, equip an owned horse, then press **START**. The paddock shows who is present and ready. | Daily objectives, unfinished collection progress, and other racers create a different reason for each visit. |
| 2 | **Ready** | Join a Gold or Purple stable, confirm readiness, and enter a shared countdown. Late players can prepare for the next heat without stopping the current one. | A synchronized start creates a fair, legible social moment and a reason to regroup. |
| 3 | **Race** | Steer, gradually build sprint speed, manage stamina, choose racing lines, and jump or avoid hurdles. Position, lap, time, audio, and animation give continuous feedback. | AI mistakes, player decisions, obstacle timing, traffic, and stamina management prevent identical runs. |
| 4 | **Coordinate or challenge** | Ride within seven metres of a teammate to grow Crown Bond; synchronized jumps grow it faster. Bond reduces stamina drain, but close formation can cost the best line. Rivals can pressure the formation. | Players make a repeated risk–reward decision: preserve the team advantage or chase individual position. |
| 5 | **Collect and invest** | Finish position, task completion, and clean racing grant horseshoes, stable XP, cumulative rank points, and calendar progress. Spend horseshoes on horses or display earned milestone horses. | Each result advances a visible collection, stable identity, named rivalry, and the next unlock. |

| | |
|---|---|
| **One complete loop takes** | **2–4 minutes.** The finish line completes the loop and opens results. Earlier payoffs arrive at the first clean hurdle, every completed lap, Crown Bond thresholds, and task-completion pop-ups. |
| **Decision, challenge, or expression** | Players time jumps, ration stamina, choose inside or safe lines, decide when to hold formation, and express status through an equipped horse. The fastest route is not always the safest team route. |
| **Shortest satisfying visit / typical session** | **3 minutes / 10–15 minutes.** A short visit completes one race; a typical visit includes a daily claim, three or four races, task progress, and a stable decision. |
| **Why repetition 10 remains appealing** | Human traffic changes the racing line; teammates change stamina strategy; AI has seeded mistakes and imperfect jumps; daily task combinations reward different behaviours; cumulative rivals and horse goals make the result matter beyond one time. |

**Pillars**

1. **Readable arcade horse racing** — four inputs, strong feedback, meaningful mastery.
2. **Partnership changes performance** — proximity and synchronized action alter stamina and team results.
3. **A stable worth returning to** — earned horses, daily objectives, status, and persistent rivalries.

---

## 4. Why Players Come Back

### 4.1 The next-day (D1) sentence

> A player who enjoyed their first session returns the next day because the rotating task board offers a new route toward their next horse and leaderboard rival, which they anticipate from the results screen and next-reward preview.

### 4.2 The progression chain

> **Race, coordinate, and complete objectives → earn horseshoes, stable XP, horses, and rank points → unlock a more expressive stable and recognizable status → choose a new objective, horse, rival, or team strategy**

| Moment | What persists or has been built? | What becomes possible next? | How can another player tell? |
|---|---|---|---|
| **End of first session** | Race rewards, stable XP, task progress, calendar day, cumulative leaderboard points, and the starter horse **Ember**. | Target a purchasable horse, complete a harder daily task, improve a clean finish, or invite a partner for Crown Bond. | The player’s equipped horse, name, stable colour, and race result are visible. |
| **End of first week** | Several completed daily sets, a higher stable level, cumulative rank, horseshoe savings, and the day-seven horse **Moonlight** if the calendar milestone was reached. | Choose between spending now or saving for rarer horses; pursue a known rival; act as an experienced Crown Bond partner. | Moonlight’s appearance and the player’s leaderboard position show progress without adding race power. |
| **Week 3+ — what takes more than two weeks?** | Epic **Nightfall** at calendar day 14, progress toward Royal **Sunfire** at day 28, a distinct collection, and a persistent competitive history. | Display rare stable identity, defend or recover a rank, help newer partners, and pursue the hardest task combinations. | Rare horse models, stable level, cumulative points, and named-rival placement remain visible. |

At the end of your first week, you open HOOF already knowing the horse above your starter is within reach. You claim the calendar milestone and Moonlight joins your stable. In the paddock, another player sees the new horse and chooses to ready beside you. You now race for more than one finish: you are protecting a visible stable identity and closing a known points gap.

**Economy line:** Horseshoes come from race finishes, daily claims, and completed tasks; they leave the economy when a horse is unlocked. Stable XP grants levels, while leaderboard points grant status rather than racing power. The main abuse risks are clock manipulation and edited local saves, so production competitive data must move to signed, Decentraland-identity-bound server storage before rewards or rankings are treated as authoritative.

### 4.3 Two return hooks

| Selected hook | Exact trigger or timing | What the player anticipates | Reminder channel + no-reminder fallback |
|---|---|---|---|
| **1. Rotating daily task board** | At 00:00 UTC, 20 tasks are deterministically drawn from a bank of 100 across race count, placing, clean races, difficulty, time, laps, and hurdles. Completed-task points add permanently to the player’s leaderboard total; the board refreshes, but rank does not reset. | A fresh set of objectives, the chance to close the gap to the next named racer, and better horseshoe/XP progress through harder tasks. | Event/Community post can highlight a challenge. Without reminders, the main menu and results screen show the new board, incomplete goals, and the next rival. |
| **2. Twenty-eight-day stable calendar** | One claim is available per UTC day. Horse milestones occur on days 7, 14, and 28; missed days pause progress instead of deleting it, and the calendar then cycles. | A known date of stable growth, a preview of the next seven rewards, and a rare horse that visibly marks long-term participation. | Optional community reminder. Without it, the claim appears on entry and the next milestone remains visible after each race. |

---

## 5. Social by Design

| | |
|---|---|
| **The repeatable social loop** | Player A readies in the paddock and holds a visible team line → Player B voluntarily readies and rides within formation → together they build Crown Bond through proximity and synchronized jumps → lower stamina drain and a shared team result give them a reason to regroup, refine formation, or challenge the opposite stable. |
| **The disappearance test** | If all other players vanish, solo racing, AI, tasks, and progression remain enjoyable, but the ready ritual, formation choice, synchronized-jump bonus, Crown Bond stamina efficiency, named human rivalry, team score, and teammate recognition disappear. The most strategically efficient social route no longer exists. |
| **From strangers to a group** | Within 30 seconds, the paddock lists racers under **Gold Stable** or **Purple Stable**, shows ready status, and gives one large **READY** action. Coloured name markers and the Crown Bond meter communicate “ride near this person” without voice or shared language. |
| **Recognition & continuity** | The player first sees another name in the paddock and above that racer’s horse. Production persistence will retain cumulative leaderboard identity, recent named rivals, stable level, and equipped horse; a later session changes because the player can target the racer directly above them or reunite with a proven Crown Bond partner. |
| **Quiet hours & player counts** | With nobody else online, a solo player enjoys racing because AI rivals make mistakes, contest lines, and sometimes miss hurdles while tasks reward varied goals. If no earlier-player data exists, the stable calendar and authored AI provide the first goals. Social play becomes viable at **2 players**; the ideal group is **4–6**; the target is **6 concurrent racers**. Tested count: `TBD:` structured multi-client test. A solo arrival sees a paddock wait state but can launch an AI-filled race immediately; scheduled community heats create reliable overlap. |
| **Drop-in / drop-out** | A late arrival joins the paddock for the next short heat and can contribute immediately as a partner or rival. A disconnected player’s horse slot returns to AI/neutral behaviour after timeout; the remaining racers continue and team scoring uses available finishers. Blocking and collision separation reduce simple griefing. |
| **Visible play (the bystander test)** | A bystander sees horses, coloured teams, positions, hurdles, a finish arch, and cheering spectators, and understands that players are racing and cooperating in formation. |
| **Shareable play (the memorable moment)** | Two differently styled horses clear the final hurdle together under the royal arch as Crown Bond reaches full strength and one wins by a head. |
| **Bring-a-friend** | After a player exhausts stamina alone or sees an unfinished team objective, they want a specific friend as a reliable formation partner. The friend changes stamina efficiency, synchronized-jump scoring, team outcome, and the social meaning of the finish. |

### Social rules and boundaries

- **Crown Bond:** grows while partnered horses remain within seven metres and both are moving; synchronized jumps accelerate growth; separation drains it.
- **Mechanical consequence:** at the active threshold, stamina drain is reduced for the linked racer. This helps sustained pace but does not remove steering or jumping skill.
- **Team consequence:** Gold and Purple results compare summed finishing places when enough human racers are present.
- **Solo protection:** every heat remains playable with AI, and social bonuses do not permanently increase horse statistics.
- **Anti-collusion direction:** daily and cumulative points come from bounded task definitions, not player-transferred value. Repeated suspicious results can be rate-limited once the signed backend is live.

---

## 6. Mobile-First

**Every core-loop verb on touch**

| Core-loop verb | How it works with touch controls |
|---|---|
| **Choose** | Large full-screen menu buttons open daily rewards, tasks, stable, leaderboard, and start flow. |
| **Ready** | One large ready control and short paddock roster; no typing is required. |
| **Race** | Left and right icon buttons steer; hold sprint to build speed gradually; tap jump to clear a hurdle. Buttons stay inside mobile safe areas. |
| **Coordinate or challenge** | Team colour, partner name marker, Crown Bond meter, and proximity feedback replace text chat. The same steering controls allow formation or overtaking. |
| **Collect and invest** | Results use large rows and a single next action; stable cards support tap-to-buy and tap-to-equip with clear owned/locked states. |

**UI plan.**

The HUD is designed around a 16:9 mobile safe area: lap information at the upper centre, stamina at the lower centre, steering at lower left, sprint/jump at lower right, and thicker camera/menu/control-mode buttons at upper right. Gold-edged royal wood sprites unify the interface, while icons carry the meaning of repeated actions.

**Performance.**

Targets are **60 fps on recommended desktop hardware** and **30 fps on a mid-range Android device using the Decentraland mobile client**, with six racers. Current performance is **not yet certified**. The test plan is `TBD:` exact Android model, then record frame time at the start grid, crowded grandstands, first hurdle, and finish. The current scene uses approximately 4,200 billboard crowd impressions, 60 animated fans, 20 ambient horses, six race horses, and a large stadium; mobile profiles must reduce crowd density, animation updates, shadow/collider cost, audio emitters, and distant architecture before the target can be claimed.

**Desktop-only dependencies.**

No core verb intentionally depends on desktop-only input. Keyboard controls (A/D or arrows, W for sprint, Space for jump) mirror touch actions. Same-realm messaging, identity, audio, and UI require verification against the current mobile client; unsupported enhancements will disable behind capability checks while solo AI racing, local progression, and touch controls remain intact. Feature-gap confirmation is `TBD:` before submission.

---

## 7. World, Look & Story

**Story / world**

HOOF is a royal countryside racing festival held at golden-hour dusk, where rival stables compete before an enormous cheering crowd. Players build a stable through racing skill and cooperation, not through wagering or real-money horse sales.

**Visual direction.**

The signature image is a third-person horse framed by a purple-and-gold royal finish arch, warm lanterns, wooden rails, banners, and packed grandstands under an orange-purple sky. Track edges use bright rails and chalk, hurdles use high-contrast silhouettes, player/team markers use Gold or Purple, and interactive UI uses consistent gold-framed brown/purple panels. Horses remain larger than decorative characters, objectives avoid low-contrast ground placement, and navigation follows a closed oval that is readable without a minimap.

### Audio direction

- A heraldic acoustic theme establishes the home screen and stops when racing begins.
- Looping hoofbeats follow player speed; jump neighs replay per jump; crowd ambience fills the stadium; a stronger cheer marks the finish.
- Countdown and button sounds confirm timing and input without requiring visual focus.

### Content and rights readiness

- Original HOOF code, layout, task definitions, progression rules, and composite UI direction are creator work.
- Horse models originated from the referenced Amir low-poly horse pack; exact commercial-use licence text and download evidence must be archived.
- Audio sources and any generated UI/background artwork need source URLs, licence screenshots/text, creator attribution requirements, and original download files in a `/design/licences/` evidence folder.
- The earlier referenced open-source Three.js project may inform learning, but no copied logic or models should ship unless its licence explicitly permits the exact use and attribution is fulfilled.
- Final submission should replace `TBD:` title clearance with a documented search decision and should keep the game free of gambling language or systems.

---

## 8. Audience & Comparables

**Primary player + arrival context**

> For players who already enjoy accessible arcade racers and horse games, arriving alone or with friends, looking for a quick competitive race with persistent stable progression.

**How the first group arrives**

The first overlapping groups come from a scheduled Decentraland Event, Discover placement, Creator Success playtests, and direct Community invitations to short six-player royal race heats. A visible start time and two-to-four-minute races allow late visitors to join the next heat quickly, keeping the two-player social threshold achievable.

**Deliberately not for**

HOOF is not designed for realistic horse-breeding simulation, passive wagering, pay-to-win progression, or players seeking a long tutorial-heavy RPG.

### Comparables

| | Comparable A — outside Decentraland: **Rival Stars Horse Racing** | Comparable B — outside Decentraland: **Mario Kart 8 Deluxe** |
|---|---|---|
| **What we observed works** | A strong horse fantasy, recognizable mounts, collection goals, and a clear pre-race-to-results rhythm give races context beyond time alone. | Four-input readability, immediate position feedback, short rounds, strong silhouettes, and changing human traffic make repeated races understandable and social. |
| **What does not fit our audience or context—and why** | Management depth, breeding complexity, and monetization-heavy collection would slow HOOF’s first minute and weaken a short Decentraland visit. | Items and chaotic attacks can make skill and cooperation feel arbitrary; direct combat also conflicts with HOOF’s elegant royal-sport tone. |
| **What we will do differently** | Keep the stable expressive rather than stat-dominant: horses are earned through play and calendar milestones, while racing mastery remains immediately available. | Replace weapons with stamina, hurdles, formation, synchronized jumps, and Crown Bond so other players matter through positioning and cooperation as well as rivalry. |

---

## 9. 4 Week Plan (V0 validation and v1 scope)

| Week | What is playable / done |
|---|---|
| **1 — Prototype definition** | Freeze the V0 promise and four racing inputs; audit all third-party licences; move production configuration away from localhost; create desktop and mobile performance profiles; instrument the 5/10 onboarding test; reduce menu choices to the essential start, task, rank, stable, and help flows. **Exit:** a new player can enter one solo heat without assistance and all content has a rights-status record. |
| **2 — Core interaction + first-group test** | Run structured two-, four-, and six-client tests of paddock readiness, remote horse interpolation, player timeout, Crown Bond, synchronized jumps, team scoring, and back-to-back heats. Tune proximity and stamina benefit so cooperation is useful but not compulsory. Test 10 new players for the 5/10 rule. **Exit:** two strangers voluntarily form once, understand why it helped, and can race again after disconnect/drop-in events. |
| **3 — Core systems refinement** | Deploy the signed identity backend or disable competitive cloud claims; persist economy, daily board, cumulative points, equipped horse, stable level, and named leaderboard entries by Decentraland ID. Add validation, rate limits, UTC rules, conflict handling, and local/offline fallback. Profile and optimize crowd, stadium, horses, audio, UI, and message rates on the named mobile device. **Exit:** cross-device save and ranking survive reload, or the release is clearly labelled local-only and the global board is hidden. |
| **4 — Playable release, testing and deployment** | Complete accessibility/safe-area passes, bug fixing, six-player soak tests, audio balancing, thumbnail/metadata, privacy and Content Policy review, World deployment to **hoof.dcl.eth**, and a scheduled launch heat. Record onboarding, voluntary rematch, social action, crash, frame-rate, and return observations. **Exit:** stable public vertical slice with a documented fallback for backend or low concurrency. |

**What keeps the experience changing after launch**

- Without building a new level, variation comes from human formation choices, seeded AI errors, hurdle timing, 20 daily objectives drawn from 100, cumulative rivals, and horse collection. The task set changes daily within current support capacity.
- If an update is skipped, daily combinations, player traffic, AI variance, and persistent rival positions still create variation.
- Nothing competitive resets: horses, stable XP, horseshoes, and cumulative points persist. A new or returning player can contribute within **one race (under four minutes)** through Crown Bond because horse skins do not grant speed power.
- One behaviour that would change what we build next: players repeatedly regrouping with the same partner would prioritize named duos/crews and cooperative tasks before new track content.

**Not building in v1**

- Real-money horse sales, token rewards, wagering, cash-out, or pay-to-win statistics.
- Breeding, horse genetics, feeding/care simulation, and a large stable-management RPG.
- User-created tracks, an open-world riding map, or multiple large racecourses.
- More than one core race mode before the existing social loop meets onboarding, performance, and return thresholds.
- Standing non-goal: **never gambling**, because HOOF is a skill-and-cooperation game suitable for a broad audience.
- If V1 meets its numbers, the first V2 addition is a small persistent stable-club system with shared objectives and named duo records—not a second environment.

**Top risk + fallback**

The top risk is that the dense royal stadium and large cheering crowd fail to hold 30 fps on mobile with six synchronized racers. The fallback is a capability-based scene profile: reduce crowd cards and animated fans, remove distant ambient horses, merge or replace royal structures with lower-LOD meshes, disable nonessential colliders/shadows/audio emitters, and preserve the track, four inputs, six race slots, Crown Bond, and progression. If six-player performance remains below target, V0 caps visible network racers at four while AI and decorative crowds scale down; the social threshold of two remains intact.

---

## Submission evidence checklist

- [ ] Public build link for **hoof.dcl.eth** and exact tested client version.
- [ ] 5/10 onboarding test: participant count, device, first useful action, goal statement, and assistance required.
- [ ] Two-, four-, and six-client multiplayer test recordings or logs.
- [ ] Mobile frame-rate captures at grid, crowd turn, hurdle group, and finish.
- [ ] Cross-device persistence and leaderboard validation, or clear local-only release label.
- [ ] Licence evidence for every third-party model, audio file, font, texture, and borrowed code reference.
- [ ] Title/name clearance decision for **HOOF**.
- [ ] Thumbnail, description, spawn view, and first minute all communicate the same royal social horse-racing promise.
- [ ] Content Policy check and age rating confirmation.
- [ ] Production backend URL, privacy statement, abuse controls, and recovery plan if cloud ranking is enabled.

## Current implementation boundary

This GDD describes the intended V0/v1 experience and identifies what is already playable. The current project contains the race controller, AI field, three laps, gradual sprint, stamina, jumps, hurdle collisions, wrong-way/off-track handling, touch and desktop HUD, sound, daily task bank, cumulative points, 28-day rewards, horse collection, local persistence, royal environment, spectator population, and same-realm multiplayer/Crown Bond prototype. Production cloud saving, authoritative leaderboard operation, named-rival continuity, validated concurrent-player behaviour, mobile performance certification, and final asset-rights evidence remain release work and must not be represented as complete until tested.
