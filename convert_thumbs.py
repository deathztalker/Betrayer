import os
from PIL import Image
import glob

def convert_to_webp(folder_path):
    print(f"Converting images in: {folder_path}")
    search_patterns = [os.path.join(folder_path, '*.jpg'), os.path.join(folder_path, '*.jpeg'), os.path.join(folder_path, '*.png')]
    files = []
    for pattern in search_patterns:
        files.extend(glob.glob(pattern))
        
    for filepath in files:
        if filepath.endswith('.webp'):
            continue
            
        try:
            with Image.open(filepath) as img:
                dest_path = os.path.splitext(filepath)[0] + '.webp'
                img.save(dest_path, 'WEBP', quality=85)
                print(f"Converted: {dest_path}")
                os.remove(filepath)
        except Exception as e:
            print(f"Error converting {filepath}: {e}")

# Folder to process
folders = [
    r"c:\Users\Death\OneDrive\Documentos\Betrayer\betrayer-site\assets\gallery\thumbs"
]

for folder in folders:
    if os.path.exists(folder):
        convert_to_webp(folder)

print("Done converting gallery thumbs to WebP.")
