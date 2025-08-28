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
      
      // Add new images to state
      const updatedImages = [...prev, ...newImgs];
      
      // Add new indices to queue for processing
      const newIndices = newImgs.map((_, i) => prev.length + i);
      queueRef.current.push(...newIndices);
      
      return updatedImages;
    });
  };

  // FIFO queue processor
  useEffect(() => {
    async function processQueue() {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      
      while (queueRef.current.length > 0) {
        const idx = queueRef.current.shift();
        
        // Check if image still exists and is not already processed
        if (!images[idx] || images[idx].status === "done" || images[idx].status === "loading") {
          continue;
        }
        
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
    
    // Only process queue if there are pending items and not currently processing
    if (queueRef.current.length > 0 && !isProcessingRef.current) {
      processQueue();
    }
  }, [images, queueRef.current.length]);

  // Repeat (re-send) image processing
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
        let processedText = text.trim();
        
        // Handle list-item elements - add dash if not present
        if (objType.toLowerCase() === "list-item") {
          const trimmedText = processedText.trim();
          if (!trimmedText.startsWith('-') && !trimmedText.startsWith('*')) {
            processedText = `- ${trimmedText}`;
          }
        }
        // Handle page-header elements - add # if not present
        else if (objType.toLowerCase() === "page-header") {
          const trimmedText = processedText.trim();
          if (!trimmedText.startsWith('#')) {
            processedText = `# ${trimmedText}`;
          }
        }
        // Handle section-header elements - add ## if not present
        else if (objType.toLowerCase() === "section-header") {
          const trimmedText = processedText.trim();
          if (!trimmedText.startsWith('#')) {
            processedText = `## ${trimmedText}`;
          }
        }
        
        mdLines.push(processedText);
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
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold">img2md VLM OCR</h1>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/EvilFreelancer/vlm-ocr-to-markdown"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-800 transition-colors"
            title="View sources"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a
            href="https://t.me/evilfreelancer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors"
            title="Telegram channel"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4 text-center max-w-2xl">
        System powered by <a href="https://ollama.com/library/qwen2.5vl:7b" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-800 underline">VLM Qwen2.5VL:7B</a> for OCR<br/>and <a href="https://huggingface.co/DILHTWD/documentlayoutsegmentation_YOLOv8_ondoclaynet" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-800 underline">YOLOv8 DocLayNet</a> for document layout segmentation
      </p>
      <ImageUploader onUpload={handleUpload} />
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4 w-full max-w-xl">
          {images.map((img, idx) => (
            <ImageTile
              key={idx}
              img={img}
              isSelected={false} // Removed selectedIndex
              isLoading={img.status === "loading" || img.status === "pending"}
              onClick={() => handleOpenModal(idx)}
              onReload={() => handleRepeat(idx)}
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
