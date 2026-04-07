import json, glob, collections, math

# -- Part 1: BotKill vs BotKilled deep dive --
data = json.load(open('public/data/d3a3297e-2cdf-4a49-8450-09119b91a779.nakama-0.json'))
kills = [e for e in data['events'] if e['type'] == 'BotKill']
killed = [e for e in data['events'] if e['type'] == 'BotKilled']

print("=== BotKill events (first 4) ===")
for e in kills[:4]:
    print(f"  player={e['player']} is_human={e['is_human']} px={e['px']} py={e['py']} ts={e['ts']}")

print("\n=== BotKilled events (first 4) ===")
for e in killed[:4]:
    print(f"  player={e['player']} is_human={e['is_human']} px={e['px']} py={e['py']} ts={e['ts']}")

kill_ts = {e['ts'] for e in kills}
killed_ts = {e['ts'] for e in killed}
shared = kill_ts & killed_ts
print(f"\nShared timestamps: {shared}")
for ts in list(shared)[:3]:
    k = next(e for e in kills if e['ts'] == ts)
    d = next(e for e in killed if e['ts'] == ts)
    dist = math.sqrt((k['px']-d['px'])**2 + (k['py']-d['py'])**2)
    print(f"  ts={ts}")
    print(f"    BotKill   player={k['player']} px={k['px']} py={k['py']}")
    print(f"    BotKilled player={d['player']} px={d['px']} py={d['py']}")
    print(f"    Distance: {dist:.1f} units")

# -- Part 2: Full dataset analysis --
print("\n\n=== FULL DATASET ANALYSIS ===")
matches_index = json.load(open('public/data/matches_index.json'))

total_events = collections.Counter()
per_map = collections.defaultdict(lambda: collections.Counter())
human_kills_per_match = []
bot_positions_per_match = []
storm_coords = []
loot_coords = []
bot_kill_coords = []
botkilled_coords = []
matches_by_map = collections.Counter()
matches_by_date = collections.Counter()
solo_matches = 0
multi_human = 0
bot_only_matches = 0

for m in matches_index:
    path = f"public/data/{m['match_id']}.json"
    try:
        d = json.load(open(path))
    except:
        continue

    evts = d['events']
    matches_by_map[m['map_id']] += 1
    matches_by_date[m['date']] += 1

    h = m['humans_count']
    b = m['bots_count']
    if h == 1 and b == 0:
        solo_matches += 1
    elif h >= 2:
        multi_human += 1
    elif h == 0:
        bot_only_matches += 1

    for e in evts:
        total_events[e['type']] += 1
        per_map[m['map_id']][e['type']] += 1
        if e['type'] == 'KilledByStorm':
            storm_coords.append((e['px'], e['py'], m['map_id']))
        if e['type'] == 'Loot':
            loot_coords.append((e['px'], e['py'], m['map_id']))
        if e['type'] == 'BotKill':
            bot_kill_coords.append((e['px'], e['py'], m['map_id']))
        if e['type'] == 'BotKilled':
            botkilled_coords.append((e['px'], e['py'], m['map_id']))

    match_kills = sum(1 for e in evts if e['type'] in ('BotKill', 'Kill'))
    human_kills_per_match.append((m['match_id'], m['map_id'], match_kills))

print(f"\nTotal matches indexed: {len(matches_index)}")
print(f"  Solo human (1H, 0B metadata): {solo_matches}")
print(f"  Multi-human sessions: {multi_human}")
print(f"  Bot-only metadata: {bot_only_matches}")

print("\nMatches by map:")
for k,v in matches_by_map.most_common():
    print(f"  {k}: {v}")

print("\nMatches by date:")
for k,v in sorted(matches_by_date.items()):
    print(f"  {k}: {v}")

print("\nEvent totals (entire dataset):")
for t, c in total_events.most_common():
    print(f"  {t}: {c}")

print("\nEvents by map:")
for mp, ctr in per_map.items():
    print(f"\n  [{mp}]")
    for t, c in ctr.most_common():
        print(f"    {t}: {c}")

print("\nTop 10 highest-kill matches:")
for mid, mp, kc in sorted(human_kills_per_match, key=lambda x: -x[2])[:10]:
    print(f"  {mid} [{mp}] => {kc} kills")

print(f"\nKilledByStorm coords (map breakdown):")
storm_by_map = collections.Counter(s[2] for s in storm_coords)
for k,v in storm_by_map.items():
    print(f"  {k}: {v} storm deaths")
    coords = [(s[0], s[1]) for s in storm_coords if s[2]==k]
    xs = [c[0] for c in coords]
    ys = [c[1] for c in coords]
    if xs:
        print(f"    px range: {min(xs):.0f} to {max(xs):.0f}, mean={sum(xs)/len(xs):.0f}")
        print(f"    py range: {min(ys):.0f} to {max(ys):.0f}, mean={sum(ys)/len(ys):.0f}")

print(f"\nLoot hotspot zones (centroid per map):")
for mp in ['AmbroseValley', 'GrandRift', 'Lockdown']:
    c2 = [(s[0],s[1]) for s in loot_coords if s[2]==mp]
    if c2:
        mx = sum(x for x,y in c2)/len(c2)
        my = sum(y for x,y in c2)/len(c2)
        print(f"  {mp}: {len(c2)} loot events, centroid=({mx:.0f},{my:.0f})")

print(f"\nBotKill hotspot centroid per map (where bots die):")
for mp in ['AmbroseValley', 'GrandRift', 'Lockdown']:
    c2 = [(s[0],s[1]) for s in bot_kill_coords if s[2]==mp]
    if c2:
        mx = sum(x for x,y in c2)/len(c2)
        my = sum(y for x,y in c2)/len(c2)
        print(f"  {mp}: {len(c2)} bot kills, centroid=({mx:.0f},{my:.0f})")
