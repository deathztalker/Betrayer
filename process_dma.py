import os
from PIL import Image

def process_image(src_path, dest_full, dest_thumb):
    try:
        with Image.open(src_path) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
                
            # Crop to 1:1 (square) centered
            width, height = img.size
            if width != height:
                min_dim = min(width, height)
                left = (width - min_dim) / 2
                top = (height - min_dim) / 2
                right = (width + min_dim) / 2
                bottom = (height + min_dim) / 2
                img = img.crop((left, top, right, bottom))
            
            # Save full version
            img.save(dest_full, 'JPEG', quality=90)
            
            # Create and save thumbnail (max 400x400)
            img.thumbnail((400, 400), Image.Resampling.LANCZOS)
            img.save(dest_thumb, 'JPEG', quality=85)
            print(f"Processed: {dest_full}")
    except Exception as e:
        print(f"Error processing {src_path}: {e}")

# Paths
base_dir = r"c:\Users\Death\OneDrive\Documentos\Betrayer\betrayer-site"
img_1_src = r"C:\Users\Death\.gemini\antigravity-ide\brain\a5f7509d-db4f-48ed-9bea-321389d98043\media__1781840151890.png"
img_2_src = r"C:\Users\Death\.gemini\antigravity-ide\brain\a5f7509d-db4f-48ed-9bea-321389d98043\media__1781840129374.png"

# We will save img_1 as v3 and img_2 as v4
process_image(img_1_src, 
              os.path.join(base_dir, "assets", "merch", "merch_tshirt_dma_v3.jpg"),
              os.path.join(base_dir, "assets", "merch", "thumbs", "merch_tshirt_dma_v3.jpg"))

process_image(img_2_src, 
              os.path.join(base_dir, "assets", "merch", "merch_tshirt_dma_v4.jpg"),
              os.path.join(base_dir, "assets", "merch", "thumbs", "merch_tshirt_dma_v4.jpg"))

print("Done processing images.")
