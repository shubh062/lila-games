# Architecture Document: LILA Player Journey Tool

## 1. System Design & Tech Stack
I chose a decoupled approach: a **Python ETL pipeline** for data processing and a **Next.js (React)** application for the frontend.

* **Python ETL (`process.py`)**: Parquet files are heavily compressed columnar formats, ideal for data warehouses but terrible for browsers. Doing coordinate math and grouping by match in Python reduces the 27MB payload strictly to what the frontend needs (~3MB of JSON). 
* **Next.js (App Router)**: Picked for its ease of deployment (Vercel) and fast React compilation.
* **Tailwind CSS**: Allows rapid iteration on the sleek "Strategic Command" dark mode without maintaining messy CSS files.
* **React + SVG**: For rendering the paths instead of Canvas. SVGs are declarative, infinitely scalable, and much easier to add hover-states/tooltips to for a quick prototype than manual Canvas math.

## 2. Data Flow
1. `raw parquet` → `pandas/pyarrow` groupings by `match_id`
2. `process.py` converts world coordinates to pixel coordinates during the build step.
3. Pre-processed matches are saved as `[match_id].json` in the Next.js `public/data/` folder, alongside a lightweight index `matches_index.json`.
4. The React Client fetches `matches_index.json` to populate the sidebar. 
5. When a user clicks a match, the app fetches `[match_id].json` on demand.

## 3. Coordinate Mapping Approach (The Tricky Part)
Mapping 3D world coordinates (`x`, `z`) to 2D image pixels (`px`, `py`) requires two steps:

**Formula used in `process.py`:**
```python
# 1. Normalize World -> UV (0 to 1) 
u = (row['x'] - origin_x) / scale
v = (row['z'] - origin_z) / scale

# 2. Convert UV -> Pixel on a 1024x1024 image
px = u * 1024
# Y is flipped because image coordinates (0,0) are top-left, while Game origins are often bottom-left
py = (1 - v) * 1024 
```
By forcing this conversion during the Python step, the Next.js frontend only deals with raw pixels, preventing duplicate math on every render cycle.

## 4. Assumptions & Handling Edge Cases
* **Missing Y/Z Coordinates**: I assumed `y` is strictly vertical depth and discarded it for top-down mapping as instructed. 
* **Timestamps**: `ts` was given in 1970 UNIX epoch format. Python normalizes this to milliseconds, and the UI uses simple arithmetic against the local `minTime` to create a "00:00" scrubber.
* **Human vs Bot Detection**: Based on the README, humans always have `-` (UUIDs), so `"-" in str(player_id)` was safely used as the bot-detection heuristic.

## 5. Major Trade-offs
| Feature | Considered | Decided | Why? |
| :--- | :--- | :--- | :--- |
| **Renderer** | HTML5 Canvas | SVG Overlay | SVGs are naturally declarative and easier to animate/style via CSS for this scale (~1,000 points per player). Canvas would require a complex redraw loop just to change a hover state. |
| **Data Parsing** | Parse Parquet in Browser (using `parquet-wasm`) | Python pre-processing to JSON | Sending a WebAssembly binary plus 27MB of data to the browser is too slow. JSON split by match is instantaneous and allows instant switching between matches. |
| **Heatmaps** | Complex Grid-based Density Map | Clustered Icon Glowing | Implementing a true heat density matrix would be too time-intensive for 5 days. Glowing HTML icons over an SVG provide a highly recognizable "heat" effect immediately. |
