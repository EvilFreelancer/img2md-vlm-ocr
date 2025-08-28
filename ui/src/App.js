import React, { useState, useEffect, useRef } from "react";
import ImageUploader from "./components/ImageUploader";
import ImageTile from "./components/ImageTile";
import JsonViewer from "./components/JsonViewer";
import MarkdownViewer from "./components/MarkdownViewer";
import ImageModal from "./components/ImageModal";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/objects";

function App() {
  const [images, setImages] = useState([]); // [{file, url, result, status: 'pending'|'loading'|'done'|'error'}]
  const [showJson, setShowJson] = useState(false);
  const [showMarkdown, setShowMarkdown] = useState(false);
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

  // Generate markdown content (shared function)
  const generateMarkdown = (data) => {
    if (!data || !Array.isArray(data.objects)) {
      return "No data available";
    }

    if (data.objects.length === 0) {
      return "No objects detected.";
    }

    // Sort objects by top coordinate (y1) for top-to-bottom order
    const objectsSorted = [...data.objects].sort((a, b) => {
      const bboxA = a.bbox || [0, 0, 0, 0];
      const bboxB = b.bbox || [0, 0, 0, 0];
      return bboxA[1] - bboxB[1];
    });

    const mdLines = [];
    let pictureCount = 0;

    objectsSorted.forEach((obj) => {
      const objType = obj.type || "";
      const bbox = obj.bbox;
      const text = obj.text;

      if (objType.toLowerCase() === "picture" && bbox) {
        pictureCount++;
        // Add markdown image link
        mdLines.push(`![Picture ${pictureCount}](picture_${pictureCount}.png)`);
      } else if (text && text.trim()) {
        mdLines.push(text.trim());
      }
    });

    // Join with double newlines
    let markdown = mdLines.join("\n\n");
    
    // Ensure markdown ends with a single empty line
    if (!markdown.endsWith("\n")) {
      markdown += "\n";
    }

    return markdown;
  };

  // Download ZIP archive with JSON, Markdown and pictures
  const handleDownloadZip = async (idx) => {
    const img = images[idx];
    if (!img || !img.result || !Array.isArray(img.result.objects)) return;

    try {
      const JSZip = await import('jszip');
      const zip = new JSZip.default();

      // Get filename
      let filename = 'ocr_results';
      if (img.file.name) {
        if (img.file.name.includes('.')) {
          filename = img.file.name.substring(0, img.file.name.lastIndexOf('.'));
        } else {
          filename = img.file.name;
        }
      }

      // Add JSON file
      zip.file(`${filename}.json`, JSON.stringify(img.result, null, 2));

      const markdownContent = generateMarkdown(img.result);
      zip.file(`${filename}.md`, markdownContent);

      // Add pictures if they exist
      const pictureObjects = img.result.objects.filter(obj => 
        obj.type && obj.type.toLowerCase() === "picture" && obj.bbox
      );

      if (pictureObjects.length > 0) {
        for (let i = 0; i < pictureObjects.length; i++) {
          const obj = pictureObjects[i];
          const [x1, y1, x2, y2] = obj.bbox;
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const imageEl = new Image();
          imageEl.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            imageEl.onload = resolve;
            imageEl.onerror = reject;
            imageEl.src = img.url;
          });
          
          canvas.width = x2 - x1;
          canvas.height = y2 - y1;
          
          ctx.drawImage(imageEl, x1, y1, x2 - x1, y2 - y1, 0, 0, x2 - x1, y2 - y1);
          
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          zip.file(`picture_${i + 1}.png`, blob);
        }
      }
      
      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      alert('Error downloading ZIP archive');
    }
  };

  // Show JSON modal
  const handleShowJson = (idx) => {
    setJsonData({ ...images[idx]?.result, fileName: images[idx]?.file.name });
    setShowJson(true);
  };
  const handleCloseJson = () => {
    setShowJson(false);
    setJsonData(null);
  };

  // Show Markdown modal
  const handleShowMarkdown = (idx) => {
    setJsonData({ 
      ...images[idx]?.result, 
      fileName: images[idx]?.file.name,
      imageUrl: images[idx]?.url 
    });
    setShowMarkdown(true);
  };
  const handleCloseMarkdown = () => {
    setShowMarkdown(false);
    setJsonData(null);
  };

  // Open image modal
  const handleOpenModal = (idx) => {
    // Block modal opening if image is still loading
    if (images[idx].status === "loading" || images[idx].status === "pending") {
      return;
    }
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
              isSelected={false} // Removed selectedIndex
              isLoading={img.status === "loading" || img.status === "pending"}
              onClick={() => handleOpenModal(idx)}
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
          onDownloadZip={() => handleDownloadZip(modalIndex)}
          onShowJson={() => handleShowJson(modalIndex)}
          onShowMarkdown={() => handleShowMarkdown(modalIndex)}
        />
      )}
      {/* JSON modal */}
      {showJson && (
        <JsonViewer data={jsonData} onClose={handleCloseJson} />
      )}
      {/* Markdown modal */}
      {showMarkdown && (
        <MarkdownViewer data={jsonData} onClose={handleCloseMarkdown} generateMarkdown={generateMarkdown} />
      )}
    </div>
  );
}

export default App;
