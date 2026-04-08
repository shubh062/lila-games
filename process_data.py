import os
import pyarrow.parquet as pq
import pandas as pd
import json
import math

DATA_DIR = "player_data"
OUTPUT_DIR = "processed_data"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

MAP_CONFIG = {
    'AmbroseValley': {'scale': 900, 'origin_x': -370, 'origin_z': -473},
    'GrandRift': {'scale': 581, 'origin_x': -290, 'origin_z': -290},
    'Lockdown': {'scale': 1000, 'origin_x': -500, 'origin_z': -500}
}

all_matches = {}

for date_folder in os.listdir(DATA_DIR):
    folder_path = os.path.join(DATA_DIR, date_folder)
    if not os.path.isdir(folder_path): continue
    
    print(f"Processing folder: {date_folder}...")
    for filename in os.listdir(folder_path):
        filepath = os.path.join(folder_path, filename)
        try:
            table = pq.read_table(filepath)
            df = table.to_pandas()
        except Exception as e:
            continue
            
        if 'event' in df.columns:
            df['event'] = df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
            
        date_str = date_folder.replace("_", " ")
        df['date'] = date_str
        
        # Map pixels
        def get_pixel_coords(row):
            map_name = row['map_id']
            if map_name not in MAP_CONFIG:
                return pd.Series({'px': 0, 'py': 0})
            cfg = MAP_CONFIG[map_name]
            u = (row['x'] - cfg['origin_x']) / cfg['scale']
            v = (row['z'] - cfg['origin_z']) / cfg['scale']
            return pd.Series({'px': u * 1024, 'py': (1 - v) * 1024})
            
        coords = df.apply(get_pixel_coords, axis=1)
        df['px'] = coords['px']
        df['py'] = coords['py']
        
        for match_id, group in df.groupby('match_id'):
            if match_id not in all_matches:
                all_matches[match_id] = {
                    'match_id': match_id,
                    'map_id': group['map_id'].iloc[0],
                    'date': group['date'].iloc[0],
                    'players': set(),
                    'events': []
                }
                
            for _, row in group.iterrows():
                user_id_str = str(row['user_id'])
                all_matches[match_id]['players'].add(user_id_str)
                is_human = "-" in user_id_str
                
                # Convert TS to string or milliseconds integer
                ts_val = 0
                if pd.notnull(row['ts']):
                    try:
                        ts_val = int(pd.to_datetime(row['ts']).timestamp())
                    except:
                        ts_val = 0
                        
                evt = {
                    'player': user_id_str,
                    'is_human': is_human,
                    'type': row['event'],
                    'ts': ts_val,
                    'px': round(row['px'], 2),
                    'py': round(row['py'], 2)
                }
                # Keep original coordinates as well? Mapped are fine.
                all_matches[match_id]['events'].append(evt)

matches_index = []

print("Writing JSON files...")
for match_id, data in all_matches.items():
    data['humans_count'] = sum(1 for p in data['players'] if "-" in p)
    data['bots_count'] = len(data['players']) - data['humans_count']
    data['events_count'] = len(data['events'])
    
    # Sort events by time
    data['events'] = sorted(data['events'], key=lambda x: x['ts'])
    
    matches_index.append({
        'match_id': match_id,
        'map_id': data['map_id'],
        'date': data['date'],
        'humans_count': data['humans_count'],
        'bots_count': data['bots_count'],
        'events_count': data['events_count']
    })
    
    del data['players']
    
    # write each match
    with open(os.path.join(OUTPUT_DIR, f"{match_id}.json"), 'w') as f:
        json.dump(data, f)
        
with open(os.path.join(OUTPUT_DIR, "matches_index.json"), 'w') as f:
    json.dump(matches_index, f)

print(f"Done! Processed {len(matches_index)} matches.")
