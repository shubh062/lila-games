# LILA BLACK: Player Journey Insights

Analysis of **796 matches** across **5 days** (Feb 10–14) on three maps.
All statistics are derived from the telemetry dataset.

---

### Insight 1 — AmbroseValley is the Only Map That Gets Meaningful Play

**Evidence from the data:**

| Map | Matches Played | Share |
|---|---|---|
| AmbroseValley | 566 | 71% |
| Lockdown | 171 | 21% |
| GrandRift | 59 | 7% |

GrandRift has **7x fewer sessions** than AmbroseValley. This is not preference — players are almost certainly not discovering or returning to the other maps. The loot centroid for GrandRift sits dead-center `(535, 484)`, meaning the few players who do enter it cluster in one spot and leave. There are no economically distributed routes forcing players to spread across the map.

**Actionable for Level Designers:**
- GrandRift needs a reason to play — a high-value extraction point in an underused quadrant, or a unique mechanic not available on AmbroseValley.
- Lockdown's 3x underperformance vs AmbroseValley warrants a separate audit of spawn locations and initial loot density.

---

### Insight 2 — The Dataset Reveals a Severe Player Retention Cliff

**Evidence from the data — session count by day:**

| Date | Matches |
|---|---|
| Feb 10 | 285 |
| Feb 11 | 200 |
| Feb 12 | 162 |
| Feb 13 | 112 |
| Feb 14 | 37 |

This is an **87% drop in 4 days**. This is not normal organic decay. The visualization tool reveals that match `humans_count` is almost universally `1` — **743 of 796 matches (93%) were solo sessions** with no other human in the lobby.

The game's matchmaking is placing players into empty lobbies filled with bots. Players experience a hollow session — no tension, no human counterplay — and do not return. This is the biggest retention risk in the dataset and is visible only when you plot the `Position` vs `BotPosition` ratio per match: most matches have 1 human path with 10–15 bot paths surrounding it.

**Actionable for Level Designers:**
- Flag solo human matches as "degraded session" data for separate analysis.
- Prioritise matchmaking fixes before map iteration — bad matchmaking is making map quality metrics meaningless.

---

### Insight 3 — Kill and Loot Zones Are the Same Zone: Players Are Funnelling

**Evidence from the data — hotspot centroids per map:**

| Map | Loot Centroid | Kill Centroid | Distance |
|---|---|---|---|
| AmbroseValley | (414, 564) | (421, 547) | **~17 units** |
| GrandRift | (535, 484) | (499, 500) | ~37 units |
| Lockdown | (482, 434) | (494, 468) | ~35 units |

On AmbroseValley, the average loot pickup and the average kill event happen **17 map-units apart** — essentially the same location. This means there is one dominant zone where players drop, loot, fight, and die all within a tightly concentrated area.

In a well-designed extraction shooter, you want loot and combat to be separated: players should have to *decide* whether to engage or extract. When loot and combat zones overlap perfectly, the map forces only one viable strategy and collapses player behaviour into a single funnel.

**Actionable for Level Designers:**
- Redistribute loot outside the (400–450, 530–580) zone on AmbroseValley to create forced rotations.
- Use the heatmap overlay in this tool (toggle in sidebar) to visualise the kill density ring and identify which specific props/geometry are creating the pinch point.

---

> **Why spatial visualisation matters:** Spreadsheets can surface averages. This tool reveals *where* those averages collapse into — the specific map quadrants, the geometry traps, and the AI routing failures that raw numbers can never show.
