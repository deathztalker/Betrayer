import os
from PIL import Image

filepath = r"c:\Users\Death\OneDrive\Documentos\Betrayer\betrayer-site\assets\caratula.jpg"
if os.path.exists(filepath):
    try:
        with Image.open(filepath) as img:
            dest_path = os.path.splitext(filepath)[0] + '.webp'
            img.save(dest_path, 'WEBP', quality=85)
            print(f"Converted: {dest_path}")
            os.remove(filepath)
    except Exception as e:
        print(f"Error converting {filepath}: {e}")
else:
    print("caratula.jpg not found.")
