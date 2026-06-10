import os
import zipfile

DOWNLOADS = r'C:\Users\admin\Downloads'
OUTPUT = r'C:\Users\admin\OneDrive\Documents\anniversary_slideshow\photos_raw'

os.makedirs(OUTPUT, exist_ok=True)

zips = [f for f in os.listdir(DOWNLOADS) if f.endswith('.zip') and 'takeout' in f.lower()]
if not zips:
    zips = [f for f in os.listdir(DOWNLOADS) if f.endswith('.zip')]

print(f'נמצאו {len(zips)} קבצי ZIP')

for i, fname in enumerate(zips):
    path = os.path.join(DOWNLOADS, fname)
    print(f'[{i+1}/{len(zips)}] מחלץ: {fname}')
    with zipfile.ZipFile(path, 'r') as z:
        z.extractall(OUTPUT)

print(f'\nהושלם! הכל חולץ ל-{OUTPUT}')
