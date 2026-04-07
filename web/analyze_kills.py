import json

# Match 29be90a4: 19 BotKill, 0 BotKilled
d = json.load(open('public/data/29be90a4-15fc-409a-870d-44655e09201a.nakama-0.json'))
kills = [e for e in d['events'] if e['type'] == 'BotKill']
print('Match 29be90a4 - 19 BotKill, 0 BotKilled')
for e in kills[:5]:
    print('  player=%s is_human=%s px=%s py=%s' % (e['player'], e['is_human'], e['px'], e['py']))

# Match d3a3297e: 12 BotKill, 10 BotKilled
d2 = json.load(open('public/data/d3a3297e-2cdf-4a49-8450-09119b91a779.nakama-0.json'))
kills2 = [e for e in d2['events'] if e['type'] == 'BotKill']
killed2 = [e for e in d2['events'] if e['type'] == 'BotKilled']
print()
print('Match d3a3297e - 12 BotKill, 10 BotKilled')
print('-- BotKill [player, is_human]:')
for e in kills2:
    print('  player=%s is_human=%s' % (e['player'], e['is_human']))
print('-- BotKilled [player, is_human]:')
for e in killed2:
    print('  player=%s is_human=%s' % (e['player'], e['is_human']))

# Match 41d4555d: 3 BotKill, 11 BotKilled
d3 = json.load(open('public/data/41d4555d-1ca9-4e3d-b82f-168bef19d865.nakama-0.json'))
kills3 = [e for e in d3['events'] if e['type'] == 'BotKill']
killed3 = [e for e in d3['events'] if e['type'] == 'BotKilled']
print()
print('Match 41d4555d - 3 BotKill, 11 BotKilled')
print('-- BotKill [player, is_human]:')
for e in kills3:
    print('  player=%s is_human=%s' % (e['player'], e['is_human']))
print('-- BotKilled [player, is_human]:')
for e in killed3:
    print('  player=%s is_human=%s' % (e['player'], e['is_human']))
