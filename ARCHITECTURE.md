# Architecture Document: LILA Player Journey Visualization Tool

## 1. System Design & Tech Stack

A decoupled two-stage architecture: a **Python ETL pipeline** that processes raw Parquet data offline, and a **Next.js (React)** frontend that consumes the pre-processed output.

| Layer | Technology | Reason |
|---|---|---|
| ETL | Python, pandas, pyarrow | Parquet is a columnar binary format — converting to match-split JSON during a build step avoids shipping 27MB to the browser |
| Frontend | Next.js 14 (App Router) | React + TypeScript with file-based routing; built for Vercel deployment |
| Styling | Tailwind CSS v3 | Rapid iteration on the dark-mode command-centre aesthetic; purges unused CSS in production |
| Rendering | SVG (paths) + HTML5 Canvas (heatmap) | SVG for paths because they are declarative, animatable, and support hover tooltips. Canvas for the heatmap because it enables GPU-composited radial gradients with blur filters |

---

## 2. Data Flow

```
player_data/*.parquet
        │
        ▼
process_data.py  ←  pandas + pyarrow grouping by match_id
        │
        ▼
public/data/matches_index.json      ← lightweight index (match_id, map, date, counts)
public/data/[match_id].json         ← per-match event stream (one file per match)
        │
        ▼
Dashboard.tsx  ← fetches index on load; fetches match file on selection
        │
        ├── Sidebar.tsx      — filtering, match list, visual layer controls
        ├── MapViewer.tsx    — SVG paths + HTML icons + Canvas heatmap + Legend
        └── TimelineController.tsx  — rAF-based playback engine
```

---

## 3. Coordinate Mapping Approach

The raw Parquet data contains 3D world-space coordinates (`x`, `y`, `z`) from Unreal Engine. Mapping these to a 2D 1024x1024 minimap image requires normalisation using canonical map constants.

**Constants (from player_data/README.md):**

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

**Formula in `process_data.py`:**

```python
# Step 1: Normalise world coords → UV space (0.0 to 1.0) using canonical constants
u = (row['x'] - origin_x) / scale
v = (row['z'] - origin_z) / scale

# Step 2: Map UV → pixel coords on 1024×1024 minimap image
px = u * 1024
py = (1 - v) * 1024   # Y-flip: image origin is top-left, world origin is bottom-left
```

All coordinate mapping is pre-computed during ETL. The frontend consumes `px` and `py` directly, ensuring pixel-perfect alignment with the minimap images without expensive client-side arithmetic.

**Edge cases handled:**
- Events with `px = 0, py = 0` are filtered out in the renderer (uninitialized/telemetry-gap events)
- The `y` axis (vertical world height) is discarded — it is irrelevant for top-down minimap rendering
- Bot IDs are short integers; human IDs are hyphenated UUIDs — detection heuristic: `"-" in str(player_id)`

---

## 4. Event Type Reference

The dataset contains exactly 8 distinct event types:

| Event Type | Count (796 matches) | Meaning | Rendered As |
|---|---|---|---|
| `Position` | 51,347 | Human player position tick | Blue solid path |
| `BotPosition` | 21,712 | Bot position tick | Grey dashed path |
| `Loot` | 12,885 | Human picked up loot | 📦 Amber icon |
| `BotKill` | 2,415 | Human player killed a bot. Coordinates = Human's position when they fired. | 🎯 Green crosshair |
| `BotKilled` | 700 | Human player was killed by a bot. Coordinates = where the human died. | 💀 Red skull |
| `KilledByStorm` | 39 | Player killed by storm zone | ⚡ Fuchsia zap |
| `Kill` | 3 | Human killed another human (rare) | 🎯 Green crosshair |
| `Killed` | 3 | Human was killed by another human (rare) | 💀 Red skull |

**Crucial Event Ownership**: Per the canonical README, `BotKilled` is a **Human Fatality** (negative event) while `BotKill` is a **Bot Fatality** (positive event for the human). All events in a player's file use that player's coordinates at the time of the event.

---

## 5. Heatmap Implementation

The heatmap overlays kill and death density using the HTML5 Canvas API:

```tsx
combatEvents.forEach(evt => {
  const isKill = evt.type === 'BotKill' || evt.type === 'Kill';
  const gradient = ctx.createRadialGradient(evt.px, evt.py, 2, evt.px, evt.py, 20);
  gradient.addColorStop(0, isKill ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(evt.px - 20, evt.py - 20, 40, 40);
});
// CSS blur filter applied to canvas for smooth gradient blending
// style={{ filter: 'blur(8px) saturate(1.5)' }}
```

Green zones = high kill density. Red zones = high bot death density. The blur is applied via CSS, not Canvas, which offloads compositing to the GPU.

---

## 6. Major Trade-offs

| Decision | Alternative Considered | Why This Approach |
|---|---|---|
| Python ETL to JSON | Parse Parquet in browser (`parquet-wasm`) | 27MB WASM + data payload is too slow for initial load; per-match JSON enables instant switching |
| SVG for player paths | Canvas for everything | SVG paths natively support `<title>` tooltips, `pointer-events`, and CSS transitions without a custom hit-test loop |
| Canvas for heatmap | Glowing HTML icon clusters | Canvas radial gradients + CSS blur produce genuine density blending — overlapping events become visually additive |
| Trailing 120s window | Full match history | Rendering 50,000+ position events simultaneously causes UI hangs; trailing window keeps the render count bounded |
| Component "Master Key" | Standard reconciliation | Fast match switching caused "ghost" icons; using `key={matchId}` forces a hard component reset for 100% data integrity |
| Fast Preview (3s Zip) | Manual scrubbing only | Scrubbing 15min matches is tedious; a fixed-time Zip allows consistent "radar sweeps" of player flow |

---

## 7. Component Lifecycle & Isolation

To ensure that telemetry from one match never "leaks" into another, the dashboard using a **Master Key Reset** pattern. The `MapViewer` component instance is uniquely keyed by the `selectedMatchId`:

```tsx
<MapViewer 
  key={selectedMatchId} 
  matchId={selectedMatchId}
  ... 
/>
```

By binding the React `key` to the unique match ID, we force the browser to destroy the entire rendering context (Canvas, SVG, and DOM icons) and rebuild it from scratch whenever the user switches matches. This design choice prioritises **data accuracy** over minor re-mount performance costs, which is critical for a professional analytics tool.
