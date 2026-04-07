# LILA Player Journey Tool: Feature Walkthrough

This guide provides a comprehensive overview of the features available in the Player Journey Visualization Tool, designed to help Level Designers optimize map flow and balancing.

## 🕹️ Interactive Replayback
The core of the tool is the **Match Timeline Controller** located at the bottom of the dashboard.
- **Scrubbing**: Click and drag the scrubber to jump to any point in the match duration.
- **Playback**: Watch as player paths emerge in real-time, allowing you to see the exact sequence of rotations and engagements.

## 🗺️ Visualization Layers
We use a high-fidelity SVG overlay system to distinguish between different entity types:
- **Human Players (Solid Blue)**: Displayed as smooth, glowing paths to indicate intentional player movement and rotations.
- **Bots (Dashed Grey)**: Rendered as subtle, non-glowing lines to distinguish "noise" from actual player strategy.
- **Entity Heads**: Circles at the end of each path indicate the current live position of the player during playback.

## 💥 Event Markers (Visual Density Map)
Key gameplay interactions are marked with distinct icons. Clusters of these icons serve as a visual "heatmap" for hotspots:
- 🎯 **Crosshair (Green)**: An outgoing Kill event.
- 💀 **Skull (Red)**: A player Death (Killed).
- 📦 **Package (Amber)**: A Loot event (interaction with game economy).
- 🟣 **Fuchsia Skull**: Death caused by the Storm (zone damage).

## 🔍 Filtering & Navigation
- **Map Selection**: Switch seamlessly between `Ambrose Valley`, `Grand Rift`, and `Lockdown`.
- **Match Index**: The sidebar lists matches sorted by **Activity Level** (Event Count). 
- **Activity Badges**: Quickly identify high-engagement matches using the "Total Events" badge in the sidebar.

## 🛠️ Tactical Insights
By combining these filters, a designer can:
1. Filter by `Storm Deaths` to find un-pathable terrain.
2. Filter by `Loot` to identify under-utilized sectors of the map.
3. Compare Bot vs Human paths to tune AI navigation logic.
