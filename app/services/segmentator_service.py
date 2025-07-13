import os
from ultralytics import YOLO
from huggingface_hub import hf_hub_download
from app.settings import settings

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
    model_path = download_model_to_dir(
        settings.segmentator_repo,
        settings.segmentator_filename,
        settings.segmentator_models_dir
    )
    _model_instance = YOLO(model_path)
    return _model_instance

def run_segmentation(img_path: str) -> list:
    model = load_segmentator_model()
    results = model(source=[img_path], show_labels=False, show_conf=False, show_boxes=True)
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
