"""
Compress all gallery images to web-friendly sizes.
- Resizes to max 1200px on the longest side
- Saves as JPEG quality 80 (good balance of quality vs size)
- Creates thumbnails (400px) for the grid view
- Skips already-small files (WhatsApp images, etc.)
"""
import os
import sys
from pathlib import Path
from PIL import Image, ImageOps

GALLERY_DIR = Path("assets/gallery")
THUMB_DIR = GALLERY_DIR / "thumbs"
MAX_FULL = 1200      # max dimension for full-size images
MAX_THUMB = 400      # max dimension for thumbnails
JPEG_QUALITY = 80
THUMB_QUALITY = 70
SIZE_THRESHOLD = 500_000  # only compress files > 500KB

def compress_image(src: Path, dest: Path, max_dim: int, quality: int):
    """Resize and compress a single image."""
    try:
        img = Image.open(src)
        img = ImageOps.exif_transpose(img)  # fix rotation
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Resize if larger than max_dim
        w, h = img.size
        if max(w, h) > max_dim:
            if w > h:
                new_w = max_dim
                new_h = int(h * max_dim / w)
            else:
                new_h = max_dim
                new_w = int(w * max_dim / h)
            img = img.resize((new_w, new_h), Image.LANCZOS)
        
        # Save as JPEG
        dest_jpg = dest.with_suffix('.jpg')
        img.save(dest_jpg, 'JPEG', quality=quality, optimize=True)
        return dest_jpg
    except Exception as e:
        print(f"  ERROR: {src.name} -> {e}", file=sys.stderr)
        return None

def main():
    if not GALLERY_DIR.exists():
        print("Gallery directory not found!")
        return
    
    THUMB_DIR.mkdir(exist_ok=True)
    
    extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
    images = sorted([
        f for f in GALLERY_DIR.iterdir() 
        if f.is_file() and f.suffix.lower() in extensions
    ])
    
    print(f"Found {len(images)} images in gallery")
    
    compressed = 0
    saved_bytes = 0
    
    for i, img_path in enumerate(images, 1):
        original_size = img_path.stat().st_size
        
        # Always create thumbnail
        thumb_dest = THUMB_DIR / img_path.stem
        thumb_result = compress_image(img_path, thumb_dest, MAX_THUMB, THUMB_QUALITY)
        
        # Only compress full-size if it's over the threshold
        if original_size > SIZE_THRESHOLD:
            # Compress to a temp file
            temp_dest = img_path.parent / (img_path.stem + "_compressed")
            result = compress_image(img_path, temp_dest, MAX_FULL, JPEG_QUALITY)
            if result:
                new_size = result.stat().st_size
                # Remove original
                img_path.unlink()
                # Rename compressed to final name (always .jpg)
                final_path = img_path.parent / (img_path.stem + ".jpg")
                if result != final_path:
                    if final_path.exists():
                        final_path.unlink()
                    result.rename(final_path)
                
                reduction = original_size - new_size
                saved_bytes += reduction
                compressed += 1
                pct = (reduction / original_size) * 100
                print(f"  [{i}/{len(images)}] {img_path.name}: {original_size/1024:.0f}KB -> {new_size/1024:.0f}KB ({pct:.0f}% smaller)")
        else:
            if thumb_result:
                print(f"  [{i}/{len(images)}] {img_path.name}: {original_size/1024:.0f}KB (small, thumbnail only)")
    
    print(f"\nDone! Compressed {compressed} images.")
    print(f"Total space saved: {saved_bytes/1024/1024:.1f} MB")

if __name__ == "__main__":
    main()
