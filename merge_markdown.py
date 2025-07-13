import argparse
import os
import re
import shutil
import logging

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("merge_markdown")

def extract_page_number(filename):
    # Try to extract a page number from the filename (e.g., _page_2.md or page2.md)
    match = re.search(r'_page_(\d+)', filename)
    if match:
        return int(match.group(1))
    match = re.search(r'page(\d+)', filename)
    if match:
        return int(match.group(1))
    match = re.search(r'(\d+)', filename)
    if match:
        return int(match.group(1))
    return None

def find_markdown_files(input_dir):
    # Recursively find all .md files in the input directory
    md_files = []
    for root, _, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith('.md'):
                md_files.append(os.path.join(root, file))
    # Sort by page number if possible, otherwise alphabetically
    def sort_key(path):
        fname = os.path.basename(path)
        page = extract_page_number(fname)
        return (0, page) if page is not None else (1, fname)
    return sorted(md_files, key=sort_key)

def copy_and_rewrite_images(md_text, md_path, media_dir, media_prefix):
    # Find all image links in markdown and copy images to media_dir, rewrite paths
    def replacer(match):
        img_path = match.group(2)
        abs_img_path = os.path.join(os.path.dirname(md_path), img_path)
        if not os.path.isfile(abs_img_path):
            logger.warning(f"Image not found: {abs_img_path}")
            return match.group(0)
        img_name = os.path.basename(img_path)
        new_img_path = os.path.join(media_dir, img_name)
        # Avoid overwriting files with the same name from different sources
        base, ext = os.path.splitext(img_name)
        counter = 1
        while os.path.exists(new_img_path):
            if os.path.samefile(abs_img_path, new_img_path):
                break
            img_name = f"{base}_{counter}{ext}"
            new_img_path = os.path.join(media_dir, img_name)
            counter += 1
        shutil.copy2(abs_img_path, new_img_path)
        logger.info(f"Copied image: {abs_img_path} -> {new_img_path}")
        return f"{match.group(1)}{media_prefix}{img_name}{match.group(3)}"
    # Regex for markdown images: ![alt](path)
    pattern = re.compile(r'(!\[[^\]]*\]\()([^\)]+)(\))')
    new_text = pattern.sub(replacer, md_text)
    return new_text

def merge_markdown_files(input_dir, output_md, output_media_dir):
    if not os.path.exists(output_media_dir):
        os.makedirs(output_media_dir)
    md_files = find_markdown_files(input_dir)
    logger.info(f"Found {len(md_files)} markdown files.")
    merged_lines = []
    for md_path in md_files:
        logger.info(f"Processing {md_path}")
        with open(md_path, 'r', encoding='utf-8') as f:
            md_text = f.read()
        # Copy images and rewrite paths
        md_text = copy_and_rewrite_images(md_text, md_path, output_media_dir, os.path.basename(output_media_dir) + '/')
        merged_lines.append(md_text)
        merged_lines.append('\n')
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write('\n'.join(merged_lines))
    logger.info(f"Merged markdown written to {output_md}")

def main():
    parser = argparse.ArgumentParser(description="Merge markdown files and copy images.")
    parser.add_argument('--input-dir', '-i', required=True, help='Input directory with markdown files')
    parser.add_argument('--output-md', '-o', required=True, help='Output merged markdown file')
    parser.add_argument('--output-media-dir', '-m', required=True, help='Directory to copy images to')
    args = parser.parse_args()
    merge_markdown_files(args.input_dir, args.output_md, args.output_media_dir)

if __name__ == '__main__':
    main()
