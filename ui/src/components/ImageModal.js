import React, { useRef, useEffect, useState } from "react";
import { DownloadIcon, JsonIcon, EyeIcon, EyeOffIcon, CloseIcon } from "./icons";

// Color palette for labels
const LABEL_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e42", // orange
  "#a855f7", // purple
  "#eab308", // yellow
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#f43f5e", // pink
  "#84cc16", // lime
];
function getLabelColor(label) {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

// ImageModal component for viewing image with bbox overlay
function ImageModal({ image, objects, fileName, onClose, onDownload, onShowJson }) {
  const canvasRef = useRef(null);
  const [showBbox, setShowBbox] = useState(true);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!image) return;
    const img = new window.Image();
    img.src = image;
    img.onload = () => {
      setImgDims({ width: img.width, height: img.height });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scale = 1.9;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (showBbox && Array.isArray(objects)) {
        objects.forEach((obj) => {
          if (!Array.isArray(obj.bbox)) return;
          let [x1, y1, x2, y2] = obj.bbox;
          const left = Math.min(x1, x2) * scale;
          const top = Math.min(y1, y2) * scale;
          const right = Math.max(x1, x2) * scale;
          const bottom = Math.max(y1, y2) * scale;
          const w = right - left;
          const h = (bottom - top) * 1.5;
          if (w <= 0 || h <= 0) return;
          const color = getLabelColor(obj.label || "bbox");
          ctx.strokeStyle = color;
          ctx.lineWidth = 10;
          ctx.strokeRect(left, top, w, h);
          ctx.font = "16px Arial";
          ctx.fillStyle = color;
          if (obj.label) {
            ctx.fillText(obj.label, left, top);
          }
        });
      }
    };
  }, [image, objects, showBbox]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
          title="Close"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 mb-2 w-full justify-end">
          <button onClick={onDownload} title="Download" className="p-2 hover:bg-blue-100 rounded-full">
            <DownloadIcon className="w-5 h-5 text-blue-600" />
          </button>
          <button onClick={onShowJson} title="Show JSON" className="p-2 hover:bg-gray-100 rounded-full">
            <JsonIcon className="w-5 h-5 text-gray-600" />
          </button>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBbox}
              onChange={() => setShowBbox((v) => !v)}
              className="form-checkbox accent-blue-600"
            />
            {showBbox ? <EyeIcon className="w-5 h-5 text-blue-600" /> : <EyeOffIcon className="w-5 h-5 text-gray-400" />}
            <span className="text-xs text-gray-700">Show bbox</span>
          </label>
        </div>
        <div className="w-full flex justify-center items-center overflow-auto max-h-[70vh]">
          <canvas ref={canvasRef} className="max-w-full max-h-[70vh] border rounded" />
        </div>
        <div className="mt-2 text-xs text-gray-500 truncate w-full text-center" title={fileName}>{fileName}</div>
      </div>
    </div>
  );
}

export default ImageModal; 