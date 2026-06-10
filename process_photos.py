import os
import json
import shutil
from PIL import Image
from PIL.ExifTags import TAGS
import datetime

RAW_DIR = 'photos_raw'
OUTPUT_DIR = 'photos'
DATA_FILE = 'data.json'
MAX_WIDTH = 1200
START_YEAR = 2012
END_YEAR = 2026
SUPPORTED = ('.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif')


def get_exif_date(img):
    try:
        exif = img._getexif()
        if not exif:
            return None
        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == 'DateTimeOriginal':
                return datetime.datetime.strptime(value, '%Y:%m:%d %H:%M:%S')
    except Exception:
        return None
    return None


def get_date_from_path(path):
    try:
        mtime = os.path.getmtime(path)
        return datetime.datetime.fromtimestamp(mtime)
    except Exception:
        return None


def compress_and_save(src_path, dst_path):
    img = Image.open(src_path)
    if img.mode in ('RGBA', 'P', 'CMYK'):
        img = img.convert('RGB')
    w, h = img.size
    if w > MAX_WIDTH:
        ratio = MAX_WIDTH / w
        img = img.resize((MAX_WIDTH, int(h * ratio)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    img.save(dst_path, 'JPEG', quality=75, optimize=True)


def scan_photos(base_dir):
    results = []
    for root, dirs, files in os.walk(base_dir):
        for fname in files:
            if fname.lower().endswith(SUPPORTED):
                results.append(os.path.join(root, fname))
    return results


def main():
    print('סורק תמונות...')
    all_photos = scan_photos(RAW_DIR)
    print(f'נמצאו {len(all_photos)} תמונות\n')

    photo_data = []
    skipped = 0

    for i, src in enumerate(all_photos):
        try:
            img = Image.open(src)
            date = get_exif_date(img)
        except Exception:
            skipped += 1
            continue

        if not date:
            date = get_date_from_path(src)

        if not date:
            skipped += 1
            continue

        year = str(date.year)
        if not (START_YEAR <= int(year) <= END_YEAR):
            continue

        fname = f"{year}_{i:05d}.jpg"
        dst = os.path.join(OUTPUT_DIR, year, fname)

        try:
            compress_and_save(src, dst)
            print(f'[{i+1}/{len(all_photos)}] {year}/{fname}')
        except Exception as e:
            print(f'[{i+1}/{len(all_photos)}] שגיאה: {e}')
            skipped += 1
            continue

        photo_data.append({
            'file': f'{year}/{fname}',
            'year': year,
            'date': date.isoformat(),
            'location': ''
        })

    photo_data.sort(key=lambda x: x['date'])

    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(photo_data, f, ensure_ascii=False, indent=2)

    print(f'\nהושלם!')
    print(f'עובדו: {len(photo_data)} תמונות')
    print(f'דולגו: {skipped}')
    print(f'נשמר ב-{DATA_FILE}')


if __name__ == '__main__':
    main()
