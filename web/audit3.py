import json, os

index = json.load(open('public/data/matches_index.json'))
av = [m for m in index if m['map_id'] == 'AmbroseValley']

ph = set(); pnh = set(); bp = set()
hm = 0; bm = 0; nbp = 0; bknbp = 0; tk = 0; td = 0

for m in av:
    f = 'public/data/%s.json' % m['match_id']
    if not os.path.exists(f): continue
    d = json.load(open(f))
    hm += m['humans_count']; bm += m['bots_count']
    hbp = False; hbk = False
    for e in d['events']:
        t = e['type']
        if t == 'Position':
            (ph if e.get('is_human') else pnh).add(e['player'])
        elif t == 'BotPosition':
            bp.add(e['player']); hbp = True
        elif t == 'BotKill':
            hbk = True; tk += 1
        elif t == 'BotKilled':
            td += 1
    if not hbp: nbp += 1
    if hbk and not hbp: bknbp += 1

with open('audit_result.txt', 'w') as f:
    f.write("MATCHES: %d\n" % len(av))
    f.write("HUMAN unique (Position+is_human=True): %d\n" % len(ph))
    f.write("NON-HUMAN using Position type: %d\n" % len(pnh))
    f.write("BOT unique (BotPosition): %d\n" % len(bp))
    f.write("humans_count metadata SUM: %d\n" % hm)
    f.write("bots_count metadata SUM: %d\n" % bm)
    f.write("Matches with NO BotPosition events: %d\n" % nbp)
    f.write("Matches with BotKill but no BotPosition: %d\n" % bknbp)
    f.write("BotKill total: %d\n" % tk)
    f.write("BotKilled total: %d\n" % td)
    f.write("Non-human Position IDs sample: %s\n" % str(list(pnh)[:5]))
print("DONE - see audit_result.txt")
