import zipfile

src = r'C:\Users\admin\Downloads\אבי תמונות.zip'
dst = r'C:\Users\admin\OneDrive\Documents\anniversary_slideshow\photos_raw'

print('מחלץ...')
with zipfile.ZipFile(src, 'r') as z:
    z.extractall(dst)
print('הושלם!')
