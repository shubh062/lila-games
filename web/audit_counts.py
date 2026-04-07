import json, os

index = json.load(open('public/data/matches_index.json'))
av_matches = [m for m in index if m['map_id'] == 'AmbroseValley']

humans_by_position = set()
bots_by_botposition = set()
all_killers = set()  # players appearing in BotKill events
humans_meta_sum = 0
bots_meta_sum = 0
matches_no_botpos = 0
matches_botkill_no_botpos = 0
total_botkill = 0
total_botkilled = 0

for m in av_matches:
    f = 'public/data/%s.json' % m['match_id']
    if not os.path.exists(f):
        continue
    d = json.load(open(f))
    humans_meta_sum += m['humans_count']
    bots_meta_sum += m['bots_count']

    has_botpos = False
    has_botkill = False
    for e in d['events']:
        if e['type'] == 'Position':
            humans_by_position.add(e['player'])
        elif e['type'] == 'BotPosition':
            bots_by_botposition.add(e['player'])
            has_botpos = True
        elif e['type'] == 'BotKill':
            all_killers.add(e['player'])
            has_botkill = True
            total_botkill += 1
        elif e['type'] == 'BotKilled':
            total_botkilled += 1

    if not has_botpos:
        matches_no_botpos += 1
    if has_botkill and not has_botpos:
        matches_botkill_no_botpos += 1

# Also check: are Position events sometimes from bots?
bots_with_position = set()
for m in av_matches[:50]:
    f = 'public/data/%s.json' % m['match_id']
    if not os.path.exists(f):
        continue
    d = json.load(open(f))
    for e in d['events']:
        if e['type'] == 'Position' and not e.get('is_human', True):
            bots_with_position.add(e['player'])

print("=== AmbroseValley Audit (%d matches) ===" % len(av_matches))
print("HUMANS:")
print("  Unique UUIDs from Position events: %d" % len(humans_by_position))
print("  Sum of humans_count metadata:      %d" % humans_meta_sum)
print()
print("BOTS:")
print("  Unique IDs from BotPosition events: %d" % len(bots_by_botposition))
print("  Sum of bots_count metadata:         %d" % bots_meta_sum)
print("  Matches with ZERO BotPosition:      %d / %d" % (matches_no_botpos, len(av_matches)))
print("  Matches with BotKill but no BotPos: %d" % matches_botkill_no_botpos)
print("  Bots using 'Position' (not BotPos): %d" % len(bots_with_position))
print()
print("KILLS/DEATHS:")
print("  BotKill events total:  %d" % total_botkill)
print("  BotKilled events total: %d" % total_botkilled)
print("  Unique killers (BotKill player field): %d" % len(all_killers))
print()
# The key question: what are these 'humans_by_position' IDs?
# Are some of them non-human?
non_human_position = set()
human_position = set()
for m in av_matches:
    f = 'public/data/%s.json' % m['match_id']
    if not os.path.exists(f):
        continue
    d = json.load(open(f))
    for e in d['events']:
        if e['type'] == 'Position':
            if e.get('is_human', True):
                human_position.add(e['player'])
            else:
                non_human_position.add(e['player'])

print("POSITION EVENT BREAKDOWN:")
print("  is_human=True:  %d unique players" % len(human_position))
print("  is_human=False: %d unique players" % len(non_human_position))
print("  Sample non-human Position players:", list(non_human_position)[:5])
