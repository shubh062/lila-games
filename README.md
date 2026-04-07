# LILA BLACK - Player Journey Visualization Tool

This repository contains my submission for the LILA Games APM Written Test. It is a full-stack data visualization tool designed specifically for Level Designers.

## Features
- **Performant UI**: Built with Next.js 14 and React.
- **Python ETL Pipeline**: The heavy `parquet` processing is offloaded to a build script so the browser only deals with highly-optimized JSON.
- **Interactive Replays**: A timeline controller allows the user to scrub back and forth through intense matches.
- **Bot vs. Human Distinctions**: Solid glowing paths for Humans, subtle dashed lines for Bots.
- **Discrete Event Overlays**: Visual markers for `Kill`, `Death`, `KilledByStorm`, and `Loot`.

## Folder Structure
- `/player_data` - The raw Parquet files (not included in repo) and Minimap images.
- `/process_data.py` - The Python ETL script.
- `/web` - The Next.js web application frontend.
- `/ARCHITECTURE.md` - Technical summary of system design and coordinate mappings.
- `/INSIGHTS.md` - Three data-driven observations with evidence and match IDs.
- `/WALKTHROUGH.md` - Feature guide for Level Designers.

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

## Tech Stack
- Frontend: Next.js (App Router), React, Tailwind CSS, Lucide React (Icons).
- ETL Pipeline: Python, Pandas, PyArrow.

## Environment Variables
*(None are strictly required for this build. If adding a full backend like Supabase later, they would go in `.env.local`)*

## Tradeoffs & Feedback
Please check `ARCHITECTURE.md` for a full breakdown of why I used SVGs over Canvas, and why Python data aggregation was necessary for browser stability. For a guide on how to use the interactive features, see `WALKTHROUGH.md`.
