# LILA BLACK - Player Journey Visualization Tool
# Deployed URL: https://github.com/shubh062/lila-games


This repository contains my submission for the LILA Games APM Written Test. It is a full-stack data visualization tool designed specifically for Level Designers.

## Features
- **Performant UI**: Built with Next.js 14 and React.
- **Python ETL Pipeline**: The heavy `parquet` processing is offloaded to a build script so the browser only deals with highly-optimized JSON.
- **Interactive Replays**: A timeline controller allows the user to scrub back and forth through intense matches.
- **Bot vs. Human Distinctions**: Solid glowing paths for Humans, subtle dashed lines for Bots.
- **Discrete Event Overlays**: Visual markers for `Kill`, `Death`, `KilledByStorm`, and `Loot`.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React.
- **Data Engine**: Python 3.10+, Pandas, PyArrow (Off-browser ETL).
- **Visualization**: SVG (Dynamic Paths), Canvas API (Heatmap), CSS Transitions.

## Folder Structure
- `/process_data.py` - The Python ETL script for coordinate normalisation.
- `/web` - The Next.js project directory.
  - `/public/data` - **Optimized JSON matches** (796 matches, ~11MB total).
  - `/public/minimaps` - 1024x1024 map textures.
- `/ARCHITECTURE.md` - Technical deep-dive on **Coordinate Mapping** and performance.
- `/INSIGHTS.md` - **3 Actionable Insights** found using this tool.
- `/WALKTHROUGH.md` - A guided tour of features (Heatmaps, 100x speed, etc).

## Setup & Local Development

### 1. Data Pipeline
*Prerequisites: Python 3.7+ with `pandas` and `pyarrow`.*
To save 27MB of data streaming to the browser, I built a conversion script.
1. Place the `player_data` folder in the root directory.
2. Run `python process_data.py`.
3. Move the `minimaps` folder to `/web/public/minimaps`.
4. Move the `processed_data` folder to `/web/public/data`.

### 2. Run the Dashboard
1. `cd web`
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:3000`

## Deployment (Vercel)
This tool is built for zero-config Vercel deployment.
1. Connect your GitHub fork to Vercel.
2. Set the **Root Directory** to `web`.
3. Deploy. (The optimized data is already in `/web/public/data`).

## Data Pipeline (Local Only)
If you wish to re-process the raw data:
1. `python process_data.py`
2. This script handles the Unreal-to-Minimap coordinate math and clusters hotspots.

## High-Performance Controls
The dashboard is optimized for **speed**. Use the **Fast Preview ⚡** button to zip through any match in 3 seconds, or toggle **100x speed** for map-wide scouting.
