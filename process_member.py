import os
from PIL import Image

def process_member_image(src_path, dest_path):
    try:
        with Image.open(src_path) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            width, height = img.size
            
            # Make it a square by padding with black
            max_dim = max(width, height)
            square_img = Image.new('RGB', (max_dim, max_dim), (10, 9, 8)) # using the site's dark background color roughly #0a0908
            
            # Paste the original image in the center
            left = (max_dim - width) // 2
            top = (max_dim - height) // 2
            square_img.paste(img, (left, top))
            
            # Resize to a reasonable size for a member card (e.g. 500x500)
            square_img.thumbnail((500, 500), Image.Resampling.LANCZOS)
            square_img.save(dest_path, 'JPEG', quality=85)
            print(f"Processed: {dest_path}")
    except Exception as e:
        print(f"Error processing {src_path}: {e}")

src = r"C:\Users\Death\.gemini\antigravity-ide\brain\a5f7509d-db4f-48ed-9bea-321389d98043\media__1781845781950.png"
dest = r"c:\Users\Death\OneDrive\Documentos\Betrayer\betrayer-site\assets\members\pipe-toloza.jpg"

process_member_image(src, dest)
print("Done processing image.")
