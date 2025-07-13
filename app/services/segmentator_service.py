import os
from ultralytics import YOLO
from huggingface_hub import hf_hub_download
from app.settings import settings
from PIL import Image
import io

MODEL_REPO = settings.segmentator_repo
MODEL_FILENAME = settings.segmentator_filename
MODEL_DIR = settings.segmentator_models_dir

_model_instance = None

def ensure_dir(directory: str) -> None:
    os.makedirs(directory, exist_ok=True)

def download_model_to_dir(repo_id: str, filename: str, dest_dir: str) -> str:
    ensure_dir(dest_dir)
    model_path = hf_hub_download(
        repo_id=repo_id,
        filename=filename,
        local_dir=dest_dir,
        local_dir_use_symlinks=False
    )
    return model_path

def load_segmentator_model() -> YOLO:
    global _model_instance
    if _model_instance is not None:
        return _model_instance
    model_path = download_model_to_dir(MODEL_REPO, MODEL_FILENAME, MODEL_DIR)
    _model_instance = YOLO(model_path)
    return _model_instance

def run_segmentation(img) -> list:
    # Accepts PIL.Image, bytes, or file path
    model = load_segmentator_model()
    if isinstance(img, (str, bytes)):
        # If str: treat as file path; if bytes: open as image
        if isinstance(img, bytes):
            img = Image.open(io.BytesIO(img)).convert("RGB")
        # else: str (file path), pass as is
        results = model(source=[img], show_labels=False, show_conf=False, show_boxes=True)
    elif isinstance(img, Image.Image):
        results = model(source=[img], show_labels=False, show_conf=False, show_boxes=True)
    else:
        raise ValueError("Unsupported image type for segmentation")
    result = results[0]
    detections = []
    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy.tolist()[0]
        label_id = int(box.cls.tolist()[0])
        label_name = result.names[label_id]
        confidence = float(box.conf.tolist()[0])
        detections.append({
            "type": label_name,
            "bbox": [x1, y1, x2, y2],
            "confidence": confidence
        })
    return detections
