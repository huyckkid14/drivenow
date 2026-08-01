# DriveNow Agent Guide

## Project shape

- This is a static Three.js browser game.
- The main simulation lives in `src/main.js`.
- `index.html` loads the simulation as an ES module from the unpkg Three.js import map.
- `styles.css` contains the HUD and page styling.
- There is no package manager, build step, or generated bundle.

## Local development

- Serve the repository root at `http://localhost:4173/`.
- Preferred server command:
  `/Users/huyckkid14/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m http.server 4173`
- Keep the server running after local changes unless the user asks to stop it.
- After changing `src/main.js`, bump the `v=` query value on its script tag in `index.html` so browser refreshes load the new code.

## Required validation

- Run `node --check src/main.js` after JavaScript changes.
- Run `git diff --check` before committing.
- Confirm localhost responds with `curl -I http://localhost:4173/` when the task affects gameplay.
- Preserve unrelated user changes in a dirty worktree.

## Simulation rules

- Preserve the existing city, buildings, race area, player-only lanes, security cameras, pedestrians, audio, traffic controls, and driving controls unless the user explicitly requests a redesign.
- Player-only lanes must remain usable by the player and unavailable to ordinary bots.
- Bots should avoid spawning or moving into another vehicle. Fix collision causes rather than muting genuine collision sounds.
- Reverse behavior means physical backward movement without rotating the car to face backward.
- Traffic yielding must recover: after reversing or stopping, bots should resume forward driving when their route becomes clear.
- Police pull-over targets must use the nearest safe edge of the adjacent player-only lane, keep the full car outside normal traffic, and steer rather than slide sideways.
- During police pull-overs, nearby traffic must choose a collision-free forward or reverse clearing direction. Do not instantly flip a car's existing forward speed into reverse speed.
- The police siren continues until the player presses `O`.

## Controls to preserve

- Arrow keys: drive or walk.
- Space: handbrake drift.
- `Q` / `E`: turn signals.
- `Z`: hazards.
- `C`: enter/exit cars and context interactions.
- `H`: hold the horn.
- `P`: toggle police mode.
- `O`: stop the police siren.

## Git workflow

- Do not commit or push unless the user explicitly requests it.
- When the user says `push`, validate first, commit only the intended files, and push directly to `main` for this repository.
- Never force-push or rewrite published history unless the user explicitly requests that exact operation.
