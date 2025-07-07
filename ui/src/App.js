import React, { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import Loader from "./components/Loader";
import Controls from "./components/Controls";
import JsonViewer from "./components/JsonViewer";
import ImagePreview from "./components/ImagePreview";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/objects";

function App() {
  const [images, setImages] = useState([]); // [{file, url, result}]
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showJson, setShowJson] = useState(false);

  // Handle image upload
  const handleUpload = (files) => {
    const imgs = files.map((file) => ({ file, url: URL.createObjectURL(file), result: null }));
    setImages(imgs);
    setSelectedIndex(0);
  };

  // Send image(s) to API
  const handleSend = async () => {
    setLoading(true);
    const newImages = await Promise.all(
      images.map(async (img) => {
        const formData = new FormData();
        formData.append("file", img.file);
        try {
          const res = await fetch(API_URL, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          return { ...img, result: data };
        } catch (e) {
          return { ...img, result: { error: e.message } };
        }
      })
    );
    setImages(newImages);
    setLoading(false);
  };

  // Repeat (re-send)
  const handleRepeat = () => {
    handleSend();
  };

  // Download image with boxes
  const handleDownload = () => {
    const img = images[selectedIndex];
    if (!img || !img.result || !img.result.objects) return;
    const canvas = document.createElement("canvas");
    const imageEl = new window.Image();
    imageEl.src = img.url;
    imageEl.onload = () => {
      canvas.width = imageEl.width;
      canvas.height = imageEl.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageEl, 0, 0);
      img.result.objects.forEach((obj) => {
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
      const link = document.createElement("a");
      link.download = `result_${selectedIndex + 1}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
  };

  // Show JSON
  const handleShowJson = () => {
    setShowJson(true);
  };

  // Hide JSON
  const handleCloseJson = () => {
    setShowJson(false);
  };

  // Change selected image
  const handleSelectImage = (idx) => {
    setSelectedIndex(idx);
  };

  const selectedImage = images[selectedIndex];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Markdown OCR UI</h1>
      <ImageUploader onUpload={handleUpload} />
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4 w-full max-w-xl">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer transition w-28 h-32 ${selectedIndex === idx ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
              onClick={() => handleSelectImage(idx)}
            >
              <img
                src={img.url}
                alt={`uploaded-${idx}`}
                className="w-20 h-20 object-cover rounded mb-1"
              />
              <span className="text-xs text-gray-600 truncate w-full text-center">{img.file.name}</span>
            </div>
          ))}
        </div>
      )}
      {loading && <Loader />}
      {selectedImage && selectedImage.result && selectedImage.result.objects && !loading && (
        <ImagePreview image={selectedImage.url} objects={selectedImage.result.objects} />
      )}
      {selectedImage && !selectedImage.result && !loading && (
        <button
          onClick={handleSend}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Send to API
        </button>
      )}
      {selectedImage && selectedImage.result && !loading && (
        <Controls
          onRepeat={handleRepeat}
          onDownload={handleDownload}
          onShowJson={handleShowJson}
          disabled={loading}
        />
      )}
      {showJson && selectedImage && selectedImage.result && (
        <JsonViewer data={selectedImage.result} onClose={handleCloseJson} />
      )}
    </div>
  );
}

export default App;
