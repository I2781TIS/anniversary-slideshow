import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import json
import shutil
import face_recognition
import numpy as np
from multiprocessing import Pool, cpu_count

PHOTOS_DIR = 'photos'
OUTPUT_DIR = 'photos_filtered'
DATA_INPUT = 'data.json'
DATA_OUTPUT = 'data_filtered.json'
TOLERANCE = 0.6

ME = 'reference_faces/me.jpg'
MOM = 'reference_faces/mom.jpg'
DAD = 'reference_faces/dad.jpg'

_me_enc = None
_mom_enc = None
_dad_enc = None


def load_image_rgb(path):
    from PIL import Image
    pil_img = Image.open(path)
    if pil_img.mode != 'RGB':
        pil_img = pil_img.convert('RGB')
    return np.ascontiguousarray(np.array(pil_img, dtype=np.uint8))


def load_encoding(path):
    img = load_image_rgb(path)
    encs = face_recognition.face_encodings(img)
    if not encs:
        raise RuntimeError(f'לא נמצא פנים ב-{path}')
    return encs[0]


def init_worker(me_enc, mom_enc, dad_enc):
    global _me_enc, _mom_enc, _dad_enc
    _me_enc = me_enc
    _mom_enc = mom_enc
    _dad_enc = dad_enc


def process_photo(photo):
    src = os.path.join(PHOTOS_DIR, photo['file'])
    if not os.path.exists(src):
        return photo, False

    try:
        img = load_image_rgb(src)
        encodings = face_recognition.face_encodings(img, model='small')

        me_found = False
        parent_found = False

        for enc in encodings:
            if face_recognition.compare_faces([_me_enc], enc, tolerance=TOLERANCE)[0]:
                me_found = True
            if face_recognition.compare_faces([_mom_enc, _dad_enc], enc, tolerance=TOLERANCE)[0]:
                parent_found = True

        return photo, (me_found and parent_found)
    except Exception:
        return photo, False


def main():
    print('טוען תמונות ייחוס...')
    me_enc = load_encoding(ME)
    mom_enc = load_encoding(MOM)
    dad_enc = load_encoding(DAD)
    print('נטען בהצלחה!\n')

    with open(DATA_INPUT, encoding='utf-8') as f:
        photos = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    kept = []
    total = len(photos)
    workers = max(1, cpu_count() - 1)
    print(f'מריץ עם {workers} תהליכים מקביליים...\n')

    with Pool(workers, initializer=init_worker, initargs=(me_enc, mom_enc, dad_enc)) as pool:
        for i, (photo, result) in enumerate(pool.imap(process_photo, photos, chunksize=8)):
            status = '✓ שמור' if result else '✗ מסונן'
            print(f'[{i+1}/{total}] {status}: {photo["file"]}')

            if result:
                year_dir = os.path.join(OUTPUT_DIR, photo['year'])
                os.makedirs(year_dir, exist_ok=True)
                src = os.path.join(PHOTOS_DIR, photo['file'])
                dst = os.path.join(OUTPUT_DIR, photo['file'])
                shutil.copy2(src, dst)
                kept.append(photo)

    with open(DATA_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(kept, f, ensure_ascii=False, indent=2)

    print(f'\nסיום! נשמרו {len(kept)} תמונות מתוך {total}')


if __name__ == '__main__':
    main()
