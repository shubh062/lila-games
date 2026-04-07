import json, os, sys

index = json.load(open('public/data/matches_index.json'))
av = [m for m in index if m['map_id'] == 'AmbroseValley']

pos_humans = set()
pos_nonhumans = set()
botpos_ids = set()
hmeta = 0
bmeta = 0
no_botpos = 0
bk_no_bp = 0
tk = 0
td = 0

for m in av:
    f = 'public/data/%s.json' % m['match_id']
    if not os.path.exists(f): continue
    d = json.load(open(f))
    hmeta += m['humans_count']
    bmeta += m['bots_count']
    hbp = False
    hbk = False
    for e in d['events']:
        t = e['type']
        if t == 'Position':
            if e.get('is_human', True):
                pos_humans.add(e['player'])
            else:
                pos_nonhumans.add(e['player'])
        elif t == 'BotPosition':
            botpos_ids.add(e['player'])
            hbp = True
        elif t == 'BotKill':
            hbk = True
            tk += 1
        elif t == 'BotKilled':
            td += 1
    if not hbp: no_botpos += 1
    if hbk and not hbp: bk_no_bp += 1

lines = []
lines.append("MATCHES: %d" % len(av))
lines.append("HUMANS (Position+is_human=True): %d unique" % len(pos_humans))
lines.append("NON-HUMANS using Position type: %d unique" % len(pos_nonhumans))
lines.append("BOTS (BotPosition): %d unique" % len(botpos_ids))
lines.append("humans_count metadata sum: %d" % hmeta)
lines.append("bots_count metadata sum: %d" % bmeta)
lines.append("Matches with NO BotPosition: %d" % no_botpos)
lines.append("Matches with BotKill but no BotPosition: %d" % bk_no_bp)
lines.append("BotKill total: %d" % tk)
lines.append("BotKilled total: %d" % td)
lines.append("Sample non-human Position IDs: %s" % str(list(pos_nonhumans)[:5]))

for l in lines:
    print(l)
    sys.stdout.flush()
