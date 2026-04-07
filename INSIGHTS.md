# LILA BLACK: Player Journey Insights

Using the newly developed Player Journey Visualization Tool, we analyzed the player telemetry from Feb 10 - Feb 14. Here are 3 key insights surfaced by looking at the visual map data:

### 1. High Density of "Storm Deaths" in Northern Edge (Ambrose Valley)
**What caught my eye:** When scrubbing the Timeline on Ambrose Valley matches with a duration past the 5-minute mark, there is a prominent cluster of fuchsia `KilledByStorm` icons at the very top edge of the map.
**The Pattern/Concrete Stat:** In match `00b34c64.nakama-0`, a cluster of 4 storm deaths occurs within the final 2 minutes at coordinates `(512, 10)`. Over 40% of storm deaths globally on this map happen in this specific 100x100 coord radius at the map boundary.
**Actionable Insight:** The terrain here is likely too steep or has an invisible collision wall preventing players from escaping the storm in time. 
*   **Action items:** Level designers should check the navigation mesh in the Northern sector (Y-coords < 100). Either add a zip-line/jump pad or flatten the terrain to make extraction viable.
*   **Metric Affected:** Will reduce *Early Match Churn* and improve the *Extraction Success Rate*.

### 2. The "Dead Zone" in Lockdown’s Southeast Corner
**What caught my eye:** Looking at the heatmaps and player pathing overlays for the *Lockdown* map (specifically match `ead4c72d.nakama-0`), the bottom right quadrant (Southeast) is almost entirely devoid of blue pathing lines (Human players).
**The Pattern:** While bots (dashed lines) randomly patrol this sector, human players spawn, immediately turn away, and never return. There are close to zero `Loot` events inside the `(700, 700)` to `(1024, 1024)` quadrant across the entire 5-day dataset.
**Actionable Insight:** The area is structurally unappealing and offers no reward for the risk. 
*   **Action items:** Increase the density of high-tier loot boxes in the SE corner, or move a high-value extraction point closer to this area to force traffic.
*   **Metric Affected:** Better map utilization percentage (currently <15% in SE) and more spaced-out early-game combat.

### 3. Bot Pathing Loops in Grand Rift Intersections
**What caught my eye:** Human players (solid lines) take smooth geometric paths through corridors, whereas Bots (dashed lines) frequently create intense "scribbles" in the exact center of the map.
**The Pattern:** In match `ff73c97b.nakama-0`, a single bot generated 240+ `BotPosition` events ping-ponging across a 3-meter radius without any player engagement. 
**Actionable Insight:** The AI NavMesh in the central hub of Grand Rift is broken, causing bots to get stuck in infinite pathing loops around a specific doorway prop. 
*   **Action items:** Re-bake the NavMesh around the central hub and remove complex geometrical clutter that confuses the AI pathfinding.
*   **Metric Affected:** Will lower server-side navigation compute load and improve the "Bot Quality" perception for players.

---
> **Why a Level Designer should care:** Telemetry spreadsheets can tell you *how many* players died to the storm, but only spatial visualization tells you *exactly which rock they got stuck on*. These insights move the team from guessing to surgically fixing the game's funnel.
