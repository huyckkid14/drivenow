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
- The development server is intentionally long-running. Once the command yields a session ID, do not wait for the process to exit; verify it with a separate HTTP request and continue working.
- After changing `src/main.js`, bump the `v=` query value on its script tag in `index.html` so browser refreshes load the new code.

## Required validation

- Run `node --check src/main.js` after JavaScript changes.
- Run `git diff --check` before committing.
- Confirm localhost responds with `curl -I http://localhost:4173/` when the task affects gameplay.
- Preserve unrelated user changes in a dirty worktree.

## Simulation rules

- Preserve the existing city, buildings, race area, player-only lanes, security cameras, pedestrians, audio, traffic controls, and driving controls unless the user explicitly requests a redesign.
- Keep the `SECURITY CAMERA ROOM` entrance sign outside the building and facing outward so approaching pedestrians can read it.
- Preserve the three driving camera modes: normal chase, hood, and a true 3D cockpit. The cockpit must use car-attached geometry rather than a screen overlay, keep the road visible, include live instruments and side mirrors, and support mouse-look around the cabin.
- Exterior-only vehicle parts, including the player marker and police lightbar equipment, must not obstruct the cockpit camera. Police cockpit mode should retain its in-car patrol display while the full police equipment remains visible from exterior views.
- Player-only lanes must remain usable by the player and unavailable to ordinary bots.
- Bots should avoid spawning or moving into another vehicle. Fix collision causes rather than muting genuine collision sounds.
- Reverse behavior means physical backward movement without rotating the car to face backward.
- Traffic yielding must recover: after reversing or stopping, bots should resume forward driving when their route becomes clear.
- Police pull-over targets must enter the adjacent player-only lane far enough to leave at least one complete car width plus a safety margin between the normal road edge and the pulled-over vehicle. They must steer rather than slide sideways.
- During police pull-overs, nearby traffic must choose a collision-free forward or reverse clearing direction. Do not instantly flip a car's existing forward speed into reverse speed.
- A completed police stop supports a close-up, branching driver conversation. Show no more than two context-sensitive choices at once, and only expose violations supported by the driver's response (for example, offer the no-insurance fine only when that driver fails to provide insurance).
- When a traffic stop ends, the released bot must immediately steer back into its correct directional lane and straighten before resuming normal traffic. It must never merge into the oncoming lane or drive indefinitely along the player-only lane.
- If a released bot is blocked for a non-signal reason, it may physically reverse without rotating and retry with stronger steering toward its lane. It must not reverse when it or the blocking vehicle is legitimately waiting at a red light; wait for green instead.
- The police siren continues until the player presses `O`.

## Controls to preserve

- Arrow keys: drive or walk.
- Space: handbrake drift.
- `Q` / `E`: turn signals while driving; hold `Q` for first-person grenade aiming and release it to throw while walking.
- `Z`: hazards.
- `C`: enter/exit cars and context interactions.
- `D`: cycle normal, hood, and 3D cockpit camera views.
- Mouse movement: look around while using the 3D cockpit view.
- `H`: hold the horn.
- `P`: toggle police mode while driving; draw or holster the police pistol while walking in police mode.
- Mouse movement / click: aim and fire the drawn police pistol in first-person view; hold click for automatic fire.
- Hold `Shift`: aim down the pistol sights with a focused zoom.
- `O`: toggle the police siren.
- `1`: begin or end the close-up driver interaction after the selected vehicle has completed its pull-over.

## Git workflow

- Do not commit or push unless the user explicitly requests it.
- When the user says `push`, validate first, commit only the intended files, and push directly to `main` for this repository.
- Never force-push or rewrite published history unless the user explicitly requests that exact operation.
