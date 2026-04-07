"""
generate_map_insights.py
Pre-computes per-map aggregate spatial data for the Map Insights Panel.
Run from the web/ directory: python generate_map_insights.py
Outputs: public/data/map_insights_<MapId>.json
"""

import json
import glob
import os
import math
from collections import defaultdict

DATA_DIR = "public/data"
GRID_SIZE = 8  # Divide 1024x1024 into 8x8 grid = 128px cells
CELL_PX = 1024 // GRID_SIZE
TRAFFIC_SAMPLE_RATE = 5  # Keep every Nth position event

def cluster_coords(coords, grid_size=GRID_SIZE, cell_px=CELL_PX, min_count=3):
    """Grid-based clustering: bucket coords into cells, return zones above threshold."""
    grid = defaultdict(list)
    for px, py in coords:
        cx = int(min(px, 1023)) // cell_px
        cy = int(min(py, 1023)) // cell_px
        grid[(cx, cy)].append((px, py))

    zones = []
    for (cx, cy), points in grid.items():
        if len(points) < min_count:
            continue
        avg_x = sum(p[0] for p in points) / len(points)
        avg_y = sum(p[1] for p in points) / len(points)
        # Compute radius as max distance from centroid
        max_dist = max(math.sqrt((p[0]-avg_x)**2 + (p[1]-avg_y)**2) for p in points)
        radius = min(max(max_dist, 20), cell_px)  # Clamp between 20 and cell_px
        zones.append({
            "cx": round(avg_x, 1),
            "cy": round(avg_y, 1),
            "count": len(points),
            "radius": round(radius, 1)
        })

    # Sort by count descending, keep top 20
    zones.sort(key=lambda z: -z["count"])
    return zones[:20]


def main():
    index_path = os.path.join(DATA_DIR, "matches_index.json")
    with open(index_path) as f:
        index = json.load(f)

    # Group matches by map
    maps = defaultdict(list)
    for m in index:
        maps[m["map_id"]].append(m)

    for map_id, matches in maps.items():
        print(f"\n=== Processing {map_id} ({len(matches)} matches) ===")

        kill_coords = []
        death_coords = []
        loot_coords = []
        storm_coords = []
        traffic_coords = []
        unique_humans = set()
        unique_bots = set()  # from BotPosition + BotKill + BotKilled
        total_kills = 0
        total_deaths = 0
        total_storm = 0
        total_loot = 0
        pos_count = 0
        # Sum from metadata (most reliable overall counts)
        meta_humans_sum = 0
        meta_bots_sum = 0

        for m in matches:
            fpath = os.path.join(DATA_DIR, f"{m['match_id']}.json")
            if not os.path.exists(fpath):
                continue
            try:
                with open(fpath) as f:
                    data = json.load(f)
            except:
                continue

            meta_humans_sum += m.get('humans_count', 0)
            meta_bots_sum += m.get('bots_count', 0)

            for e in data.get("events", []):
                px, py = e.get("px", 0), e.get("py", 0)
                if px == 0 and py == 0:
                    continue

                etype = e["type"]
                player = e["player"]
                is_human = e.get("is_human", False)

                if etype == "Position":
                    if is_human:
                        unique_humans.add(player)
                    else:
                        unique_bots.add(player)  # some bots use Position type
                    pos_count += 1
                    if pos_count % TRAFFIC_SAMPLE_RATE == 0:
                        traffic_coords.append([round(px, 1), round(py, 1)])
                elif etype == "BotPosition":
                    unique_bots.add(player)
                    pos_count += 1
                    if pos_count % TRAFFIC_SAMPLE_RATE == 0:
                        traffic_coords.append([round(px, 1), round(py, 1)])
                elif etype in ("BotKill", "Kill"):
                    kill_coords.append([round(px, 1), round(py, 1)])
                    total_kills += 1
                    # Track bots that appear in kill events too
                    if not is_human:
                        unique_bots.add(player)
                elif etype in ("BotKilled", "Killed"):
                    death_coords.append([round(px, 1), round(py, 1)])
                    total_deaths += 1
                    if not is_human:
                        unique_bots.add(player)
                elif etype == "KilledByStorm":
                    storm_coords.append([round(px, 1), round(py, 1)])
                    total_storm += 1
                elif etype == "Loot":
                    loot_coords.append([round(px, 1), round(py, 1)])
                    total_loot += 1

        # Build clusters
        kill_zones = cluster_coords([(c[0], c[1]) for c in kill_coords])
        death_zones = cluster_coords([(c[0], c[1]) for c in death_coords])
        loot_zones = cluster_coords([(c[0], c[1]) for c in loot_coords], min_count=10)
        traffic_zones = cluster_coords([(c[0], c[1]) for c in traffic_coords], min_count=20)

        output = {
            "map_id": map_id,
            "total_matches": len(matches),
            "summary": {
                "unique_humans": len(unique_humans),
                "unique_bots": len(unique_bots),
                "total_human_sessions": meta_humans_sum,
                "total_bot_sessions": meta_bots_sum,
                "kills": total_kills,
                "deaths": total_deaths,
                "storm_deaths": total_storm,
                "loot": total_loot
            },
            "kill_coords": kill_coords,
            "death_coords": death_coords,
            "loot_coords": loot_coords,
            "storm_coords": storm_coords,
            "traffic_coords": traffic_coords,
            "clusters": {
                "kill_zones": kill_zones,
                "death_zones": death_zones,
                "loot_zones": loot_zones,
                "traffic_zones": traffic_zones
            }
        }

        out_path = os.path.join(DATA_DIR, f"map_insights_{map_id}.json")
        with open(out_path, "w") as f:
            json.dump(output, f)

        print(f"  Unique humans: {len(unique_humans)}, Unique bots: {len(unique_bots)}")
        print(f"  Human sessions (meta sum): {meta_humans_sum}, Bot sessions (meta sum): {meta_bots_sum}")
        print(f"  Kills: {total_kills}, Deaths: {total_deaths}, Storm: {total_storm}, Loot: {total_loot}")
        print(f"  Traffic samples: {len(traffic_coords)}")
        print(f"  Clusters: kills={len(kill_zones)}, deaths={len(death_zones)}, loot={len(loot_zones)}, traffic={len(traffic_zones)}")
        print(f"  Saved → {out_path}")


if __name__ == "__main__":
    main()
