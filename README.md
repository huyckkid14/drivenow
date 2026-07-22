# DriveNow

A static Three.js mini city driving game for GitHub Pages.

- Arrow keys drive the player car.
- `Q` toggles the left indicator.
- `R` toggles the right indicator.
- `Z` toggles hazards.
- Bot cars follow the city map, obey traffic lights, and brake for traffic.
- The bot sensitivity slider ranges from the original traffic behavior to extreme collision avoidance. When an imminent collision is predicted in a bot's current lane, it prefers reversing and may swerve onto a sidewalk when backing up is blocked.
- The traffic slider sets the live bot population from empty streets to exactly 200 cars at 100%, replenishing traffic whenever a bot leaves the city.
- New bots only spawn when their oriented car body plus a safety margin does not overlap another vehicle.
- Bots never spawn inside intersections and enter traffic from rest so signals and following-distance checks apply before they move.
- Bots wait behind the stop line only when the nearest car in their own lane leaves insufficient room beyond the intersection.
- Traffic lights use 10-second greens, 2-second yellows, and 2-second all-red safety intervals.
- The blue-gray player-only side lanes are 12.5 units wide, providing approximately 10 extra units beyond the player car's width. They are segmented between intersections so bot roads and crossings remain uncovered.
- The original compact city layout and all buildings are preserved. Buildings retain solid collision boxes even where oversized player-lane graphics overlap them.
- Building collision boxes now closely match visible walls, and the reserved lane uses the player's actual half-width instead of an oversized circular clearance, leaving room to steer around structures.
- Initial traffic alternates between horizontal and vertical spawn candidates so both travel axes receive cars.
- Every car has a speed- and load-responsive engine voice with distance attenuation and stereo positioning; only nearby voices stay active for performance with dense traffic.
- Engine voices peak at about 80% of the horn's reference volume, with distance attenuation and master compression for dense traffic.
- Hold Up and Down together while stopped to rev the player engine and produce exhaust smoke.
- Press C while stopped to smoothly open the door and exit; on foot, Up/Down walk forward or backward and Left/Right steer just like driving. Press C near the blue car beacon to get back in; traffic yields to pedestrians and the chase-camera framing stays consistent.
- A blue player-only gate at the east end of the center road leads to a huge oval racing circuit for high-speed driving; traffic bots remain confined to the city. Hold Space while moving and steering to handbrake-drift with reduced rear grip, lateral momentum, and tire smoke.
- The player starts on the racing circuit's lower straight and returns there after restarting.
- Fifty animated pedestrian NPCs keep roughly two walkers assigned to every intersection. They patrol short local routes, stop at non-green crossings, cannot pass through vehicle bodies, and traffic yields to them. A pedestrian struck by the player car collapses, then gets back up after five seconds.
- Traffic cars engage reverse gear without turning around when a pedestrian enters their close safety zone; queued cars propagate the backward maneuver so the front car is not trapped.
- Bots continuously match the car ahead with a small bumper gap and slow to a controlled entry speed before every intersection.
- Dense road positions are used only for initial population; replacement traffic enters exclusively from clear city-boundary lanes.
- Off-map cars and vehicles in crossing or adjacent lanes are excluded from following and intersection-occupancy checks.
- Collisions immobilize the affected cars and turn their hazards on.
- If the player is involved in a collision, a restart button resets the city.
