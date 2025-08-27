import React, { useState, useEffect, useRef } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageTile from "./components/ImageTile";
import Loader from "./components/Loader";
import JsonViewer from "./components/JsonViewer";
import ImageModal from "./components/ImageModal";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/objects";

function App() {
  const [images, setImages] = useState([]); // [{file, url, result, status: 'pending'|'loading'|'done'|'error'}]
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [jsonData, setJsonData] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);
  const queueRef = useRef([]);
  const isProcessingRef = useRef(false);

  // Add new images to queue and state
  const handleUpload = (files) => {
    setImages((prev) => {
      const newImgs = files.map((file, i) => ({
        file,
        url: URL.createObjectURL(file),
        result: null,
        status: "pending",
      }));
      // Push new indices to queue
      queueRef.current.push(...newImgs.map((_, i) => prev.length + i));
      return [...prev, ...newImgs];
    });
  };

  // FIFO queue processor
  useEffect(() => {
    async function processQueue() {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      while (queueRef.current.length > 0) {
        const idx = queueRef.current.shift();
        setImages((prev) => {
          const arr = [...prev];
          if (arr[idx]) arr[idx].status = "loading";
          return arr;
        });
        try {
          const formData = new FormData();
          formData.append("file", images[idx].file);
          const res = await fetch(API_URL, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          // Use backend-provided bbox as-is ([x1, y1, x2, y2])
          const mappedObjects = Array.isArray(data.objects)
            ? data.objects.map(obj => ({ ...obj }))
            : [];
          setImages((prev) => {
            const arr = [...prev];
            if (arr[idx]) {
              arr[idx].result = { ...data, objects: mappedObjects };
              arr[idx].status = "done";
            }
            return arr;
          });
        } catch (e) {
          setImages((prev) => {
            const arr = [...prev];
            if (arr[idx]) {
              arr[idx].result = { error: e.message };
              arr[idx].status = "error";
            }
            return arr;
          });
        }
      }
      isProcessingRef.current = false;
    }
    if (queueRef.current.length > 0) {
      processQueue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  // Repeat (re-send)
  const handleRepeat = (idx) => {
    setImages((prev) => {
      const arr = [...prev];
      if (arr[idx]) {
        arr[idx].status = "pending";
        arr[idx].result = null;
      }
      return arr;
    });
    queueRef.current.push(idx);
  };

  // Download image with boxes
  const handleDownload = (idx) => {
    const img = images[idx];
    if (!img || !img.result || !Array.isArray(img.result.objects)) return;
    const canvas = document.createElement("canvas");
    const imageEl = new window.Image();
    imageEl.src = img.url;
    imageEl.onload = () => {
      canvas.width = imageEl.width;
      canvas.height = imageEl.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imageEl, 0, 0);
      img.result.objects.forEach((obj) => {
        const [x1, y1, x2, y2] = obj.bbox;
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x2 - x1);
        const h = Math.abs(y2 - y1);
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
      link.download = `result_${idx + 1}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
  };

  // Show JSON modal
  const handleShowJson = (idx) => {
    setJsonData(images[idx]?.result);
    setShowJson(true);
  };
  const handleCloseJson = () => {
    setShowJson(false);
    setJsonData(null);
  };

  // Open image modal
  const handleOpenModal = (idx) => {
    setModalIndex(idx);
  };
  const handleCloseModal = () => {
    setModalIndex(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Markdown OCR UI</h1>
      <ImageUploader onUpload={handleUpload} />
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4 w-full max-w-xl">
          {images.map((img, idx) => (
            <ImageTile
              key={idx}
              img={img}
              isSelected={selectedIndex === idx}
              isLoading={img.status === "loading" || img.status === "pending"}
              onClick={() => handleOpenModal(idx)}
              onDownload={() => handleDownload(idx)}
              onRepeat={() => handleRepeat(idx)}
              onShowJson={() => handleShowJson(idx)}
            />
          ))}
        </div>
      )}
      {/* Image modal with bbox and controls */}
      {modalIndex !== null && images[modalIndex] && (
        <ImageModal
          image={images[modalIndex].url}
          objects={Array.isArray(images[modalIndex].result?.objects) ? images[modalIndex].result.objects : []}
          fileName={images[modalIndex].file.name}
          onClose={handleCloseModal}
          onDownload={() => handleDownload(modalIndex)}
          onShowJson={() => handleShowJson(modalIndex)}
        />
      )}
      {/* JSON modal */}
      {showJson && (
        <JsonViewer data={jsonData} onClose={handleCloseJson} />
      )}
    </div>
  );
}

export default App;
