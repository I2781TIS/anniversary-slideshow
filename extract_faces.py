import sys
sys.stdout.reconfigure(encoding='utf-8')
import face_recognition
from PIL import Image
import os

SRC = 'reference_faces/family.jpg'
OUT_DIR = 'reference_faces/extracted'

os.makedirs(OUT_DIR, exist_ok=True)

pil_src = Image.open(SRC)
if pil_src.mode != 'RGB':
    pil_src = pil_src.convert('RGB')
import numpy as np
img = np.ascontiguousarray(np.array(pil_src, dtype=np.uint8))
print('shape:', img.shape, 'dtype:', img.dtype)
locations = face_recognition.face_locations(img)

print(f'נמצאו {len(locations)} פנים')

pil_img = Image.open(SRC)

for i, (top, right, bottom, left) in enumerate(locations):
    # add some padding
    pad_y = int((bottom - top) * 0.4)
    pad_x = int((right - left) * 0.4)
    box = (
        max(0, left - pad_x),
        max(0, top - pad_y),
        min(pil_img.width, right + pad_x),
        min(pil_img.height, bottom + pad_y),
    )
    face = pil_img.crop(box)
    out_path = os.path.join(OUT_DIR, f'face_{i}.jpg')
    face.save(out_path)
    print(f'נשמר: {out_path}')
