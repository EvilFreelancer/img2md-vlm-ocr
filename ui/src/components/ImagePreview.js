import React, { useRef, useEffect } from "react";

// ImagePreview component for showing image with bounding boxes
function ImagePreview({ image, objects }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!image || !Array.isArray(objects)) return;
    const img = new window.Image();
    img.src = image;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      // Draw bounding boxes
      objects.forEach((obj) => {
        const [x, y, w, h] = obj.bbox;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.font = "14px Arial";
        ctx.fillStyle = "#ef4444";
        if (obj.label) {
          ctx.fillText(obj.label, x + 4, y + 16);
        }
      });
    };
  }, [image, objects]);

  if (!image || !Array.isArray(objects)) return null;

  return (
    <div className="relative w-full flex justify-center items-center bg-white p-2 rounded shadow">
      <canvas ref={canvasRef} className="max-w-full max-h-[60vh]" />
    </div>
  );
}

export default ImagePreview;
