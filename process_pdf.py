import argparse
import os
import sys
import time
import logging
import requests
import json
from pdf2image import convert_from_path
from PIL import Image

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("process_pdf")


def pdf_to_pngs(pdf_path, out_dir):
    logger.info(f"Converting PDF to PNG: {pdf_path}")
    images = convert_from_path(pdf_path)
    png_files = []
    base = os.path.splitext(os.path.basename(pdf_path))[0]
    for i, img in enumerate(images):
        png_name = f"{base}_page_{i + 1}.png"
        png_path = os.path.join(out_dir, png_name)
        img.save(png_path, "PNG")
        png_files.append(png_path)
        logger.info(f"Saved: {png_path}")
    return png_files


def post_image(api_url, image_path, retries=3, sleep_sec=2):
    for attempt in range(1, retries + 1):
        try:
            with open(image_path, "rb") as f:
                files = {"file": (os.path.basename(image_path), f, "image/png")}
                logger.info(f"POST {api_url} (attempt {attempt}) for {image_path}")
                resp = requests.post(api_url, files=files, timeout=600)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, dict) and data.get("objects"):
                logger.info(f"Got {len(data['objects'])} objects for {image_path}")
                return data
            else:
                logger.warning(f"Empty objects for {image_path} (attempt {attempt})")
        except Exception as e:
            logger.error(f"Error on {image_path} (attempt {attempt}): {e}")
        if attempt < retries:
            time.sleep(sleep_sec)
    logger.error(f"Failed to get objects for {image_path} after {retries} attempts")
    return None


def save_markdown(md_text, png_path):
    md_path = os.path.splitext(png_path)[0] + ".md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_text or "")
    logger.info(f"Saved markdown: {md_path}")
    return md_path


def extract_and_save_bbox_objects(objects, png_path, out_dir):
    img = Image.open(png_path)
    base = os.path.splitext(os.path.basename(png_path))[0]
    obj_dir = os.path.join(out_dir, base)
    os.makedirs(obj_dir, exist_ok=True)
    for idx, obj in enumerate(objects):
        label = obj.get("label", "")
        if label not in ("table", "image"):
            continue
        bbox = obj.get("bbox_2d") or obj.get("bbox")
        if not bbox or len(bbox) != 4:
            logger.warning(f"Invalid bbox for object {idx} in {png_path}")
            continue
        x1, y1, x2, y2 = map(int, bbox)
        crop = img.crop((x1, y1, x2, y2))
        crop_name = f"{label}_{idx + 1}.png"
        crop_path = os.path.join(obj_dir, crop_name)
        crop.save(crop_path)
        logger.info(f"Saved {label} crop: {crop_path}")
    return obj_dir


def parse_pages(pages_str, total_pages):
    # Parse the --pages argument and return a list of page numbers to process
    if not pages_str:
        return list(range(1, total_pages + 1))
    pages_str = pages_str.strip()
    if "," in pages_str:
        parts = [p.strip() for p in pages_str.split(",") if p.strip()]
        if len(parts) == 1:
            # --pages ,8 or 2,
            if pages_str.startswith(","):
                end = int(parts[0])
                return list(range(1, end + 1))
            elif pages_str.endswith(","):
                start = int(parts[0])
                return list(range(start, total_pages + 1))
        # --pages 1,2,3
        return [int(p) for p in parts]
    else:
        # --pages 2 (only page 2)
        try:
            page = int(pages_str)
            return [page]
        except ValueError:
            return []


def main():
    parser = argparse.ArgumentParser(description="Process PDFs: convert to PNG, send to API, save markdown and crops.")
    parser.add_argument("--input", "-i", required=True, help="Input PDF file")
    parser.add_argument("--api", "-a", default="http://localhost:8000/api/objects", help="API endpoint URL")
    parser.add_argument("--retries", "-r", type=int, default=3, help="Number of retries for empty response")
    parser.add_argument("--out", "-o", default=None, help="Output folder (default: input folder)")
    parser.add_argument("--pages", type=str, default=None, help="Pages to process: e.g. 1,2,3 or 2 or ,8 or 3,5,7")
    args = parser.parse_args()

    input_pdf = args.input
    api_url = args.api
    retries = args.retries
    out_dir = args.out or os.path.dirname(input_pdf)

    if not os.path.isfile(input_pdf) or not input_pdf.lower().endswith(".pdf"):
        logger.error(f"Input file {input_pdf} is not a PDF file or does not exist.")
        sys.exit(1)

    pdf_path = input_pdf
    all_png_files = pdf_to_pngs(pdf_path, out_dir)
    total_pages = len(all_png_files)
    page_numbers = parse_pages(args.pages, total_pages)
    # Filter PNG files by selected pages
    png_files = [all_png_files[i - 1] for i in page_numbers if 1 <= i <= total_pages]
    for png_path in png_files:
        data = post_image(api_url, png_path, retries=retries)
        if not data:
            logger.error(f"Skipping {png_path} due to empty/failed response")
            continue

        # Collect markdown from all objects (only text fields)
        md_lines = []
        for obj in data.get("objects", []):
            text = obj.get("text")
            if text:
                label = obj.get("label", "")
                if label == "heading":
                    md_lines.append(f"## {text.strip()}")
                else:
                    md_lines.append(text.strip())
        md_text = "\n\n".join(md_lines)
        md_path = save_markdown(md_text, png_path)

        # If there are tables or images, save crops by bbox
        has_special = any(obj.get("label") in ("table", "image") for obj in data.get("objects", []))
        if has_special:
            extract_and_save_bbox_objects(data["objects"], png_path, out_dir)


if __name__ == "__main__":
    main()
