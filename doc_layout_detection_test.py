import sys
import os
import json
import pathlib
from ultralytics import YOLO
from PIL import Image, ImageDraw
from huggingface_hub import hf_hub_download

MODEL_REPO = "DILHTWD/documentlayoutsegmentation_YOLOv8_ondoclaynet"
MODEL_FILENAME = "yolov8x-doclaynet-epoch64-imgsz640-initiallr1e-4-finallr1e-5.pt"
MODEL_DIR = "models"


def ensure_dir(directory: str) -> None:
    os.makedirs(directory, exist_ok=True)


def download_model_to_dir(repo_id: str, filename: str, dest_dir: str) -> str:
    ensure_dir(dest_dir)
    print(f"Checking model in Hugging Face Hub, will cache to '{dest_dir}' if needed...")
    model_path = hf_hub_download(
        repo_id=repo_id,
        filename=filename,
        local_dir=dest_dir,
        local_dir_use_symlinks=False
    )
    print(f"Model is ready at: {model_path}")
    return model_path


def load_model() -> YOLO:
    model_path = download_model_to_dir(MODEL_REPO, MODEL_FILENAME, MODEL_DIR)
    return YOLO(model_path)


def run_inference(model: YOLO, img_path: str) -> list:
    results = model(source=[img_path], show_labels=True, show_conf=True, show_boxes=True)
    result = results[0]
    detections = []

    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy.tolist()[0]
        label_id = int(box.cls.tolist()[0])
        label_name = result.names[label_id]
        confidence = float(box.conf.tolist()[0])

        detections.append({
            "type":       label_name,
            "bbox":       [x1, y1, x2 - x1, y2 - y1],
            "confidence": confidence
        })
    return detections


def draw_bboxes(img_path: str, detections: list) -> Image:
    image = Image.open(img_path).convert("RGB")
    draw = ImageDraw.Draw(image)

    for det in detections:
        x, y, w, h = det['bbox']
        label = det['type']
        confidence = det['confidence']

        pt1 = (int(x), int(y))
        pt2 = (int(x + w), int(y + h))

        draw.rectangle([pt1, pt2], outline="green", width=2)
        draw.text((x, y - 10), f"{label} {confidence:.2f}", fill="red")

    return image


def save_image(image: Image, out_path: str) -> None:
    image.save(out_path)
    print(f"Saved annotated image to {out_path}")


def save_json(data: list, out_path: str) -> None:
    with open(out_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Saved detections JSON to {out_path}")


def process_image(img_path: str, model: YOLO) -> None:
    base_path = pathlib.Path(img_path).with_suffix('')
    json_path = f"{base_path}.bbox.json"
    out_img_path = f"{base_path}.bbox.png"

    detections = run_inference(model, img_path)
    annotated_image = draw_bboxes(img_path, detections)

    save_json(detections, json_path)
    save_image(annotated_image, out_img_path)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python doc_layout_detection_test.py <path_to_image>")
        sys.exit(1)

    img_path = sys.argv[1]
    model = load_model()
    process_image(img_path, model)
