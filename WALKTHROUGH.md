# LILA Player Journey Tool: Feature Walkthrough

A complete guide to every feature in the dashboard, written for a Level Designer using the tool for the first time.

> **Running the tool:** `cd web && npm install && npm run dev` → open `http://localhost:3000`

---

## 1. Map & Match Selection (Left Sidebar — Top)

### Map Tabs
Three toggle buttons switch between maps: **AmbroseValley**, **Grand Rift**, **Lockdown**. 
- **Immediate Reset**: Switching maps instantly wipes all telemetry and icons from the previous map, ensuring you always start with a clean slate.

### Date Filter
A dropdown filters the match list to a specific session date (Feb 10–14) or shows all dates. Useful for comparing early-session vs late-session player behaviour.

### Match List
Below the filters is a scrollable list of matches, sorted by **Total Events** (most active matches at the top). Each entry shows:
- Truncated Match UUID for identification
- 👥 Human player count, 🤖 Bot count, ⚡ Total event count

Click any match to load it. The map and timeline update immediately.

---

## 2. Visual Layers Panel (Left Sidebar — Middle)

### Heatmap Overlay
Toggles a Canvas-rendered density heatmap over the minimap.
- **Green zones** = high kill density (where killing shots were fired)
- **Red zones** = high bot death density (where bots fell)
- **Adaptive Sync**: Turning off "Kills" in the markers section below also removes the green heatmap glow.

### Event Markers (Unified Filtering)
Each button independently shows or hides that event type on the map. **Modern update**: These filters now globally affect all layers, including the Heatmap and Aggregate Insights.

| Button | Event | Icon | What it shows |
|---|---|---|---|
| **Kills** | `BotKill` / `Kill` | 🎯 Green Crosshair | Where the killer was standing. Also toggles Green Heatmap. |
| **Deaths** | `BotKilled` / `Killed` | 💀 Red Skull | Where the victim fell. Also toggles Red Heatmap. |
| **Loot** | `Loot` | 📦 Amber Box | Where loot was taken. Also toggles Aggregate Loot Density dots. |
| **Storm** | `KilledByStorm` | ⚡ Fuchsia Zap | Where a player was caught by the storm zone. |

### Show Paths — Entity Filter
Three buttons control which player movement paths are rendered:
- **All** — show both human and bot paths simultaneously
- **Humans** — show only the human player's path (solid blue with glow)
- **Bots** — show only bot paths (dashed grey)

---

## 3. The Map Viewport (Centre)

### Stats Bar (top of map)
A persistent strip showing match composition at a glance:
- Solid line icon = Humans, Dashed line icon = Bots.
- 🎯 Kill count, 💀 Death count, ⚡ Storm count, 📦 Loot count.

### Player Paths
- **Solid blue glowing line** = Human player movement trail (last 120 seconds of playback)
- **Dashed grey line** = Bot movement trail
- **Floating Labels**: Each live entity is marked with **H** (human) or **B** (bot) for instant identification.

Hover any path or icon to see detailed metadata (Player UUID, type, timestamp) in a tooltip.

---

## 4. Timeline Controller (Bottom Bar)

### Robust Seeker Bar
I replaced the custom bar with a **Native Range Slider**.
- **Zero-Lag Scrubbing**: You can now drag, click, and scrub with pixel-perfect accuracy.
- **Visual Feedback**: The purple-to-cyan gradient track fills as the match progresses.

### Play / Pause
Press the play button to begin animated playback. The tool uses a **120-second trailing window** — only the most recent 2 minutes of movement is visible at any time to keep the map clean.

### Fast Preview ⚡ (3s Zip)
A high-performance button designed for rapid match audits.
- Click **Fast Preview ⚡** to zip through the entire match in exactly **3 seconds**.
- Perfect for getting a 10,000-ft view of player flow without manually scrubbing.

### Supercharged Speed Control
The speed selector is optimized for production-grade telemetry analysis:
- **Speeds**: `1x → 10x → 20x → 50x → 100x`
- **Default**: Starts at **50x** for instant scouting.
- **Extreme Mode**: Use **100x** for the fastest possible traversals.

---

## 5. Workflow — Level Design Scenarios

### Scenario A: Finding Kill Funnels
1. Select a match → Enable **Heatmap Overlay**.
2. Click **Fast Preview ⚡** to see how the "Green Glow" (kill density) shifts over time.
3. Identify the static green rings — these are your map's permanent meat grinders.

### Scenario B: Auditing Bot AI Pathing
1. Switch **Show Paths → Bots Only**.
2. Set Speed to **20x** or **50x**.
3. Watch for dashed lines that "huddle" or circle the same area — this indicates navigation mesh bottlenecks.

### Scenario C: Global "Loot-to-Kill" Audit
1. Go to the **Right Sidebar** (Map Insights Panel).
2. Toggle **Loot Density** vs **Death Zones (Aggregate)**.
3. Use the **Unified Filters** (Left Sidebar) to quickly toggle categories and see if loot and deaths overlap across 100s of matches.
nute matches
3. ⚡ icons at the map boundary = players failing to extract due to terrain geometry
