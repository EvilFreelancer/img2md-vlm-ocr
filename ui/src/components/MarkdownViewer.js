import React, { useState, useEffect } from "react";
import { CloseIcon } from "./icons";

function MarkdownViewer({ data, onClose, generateMarkdown }) {
  const [activeTab, setActiveTab] = useState('source'); // 'source' or 'preview'
  const [processedImages, setProcessedImages] = useState({});

  // Process images to create cropped versions for preview
  useEffect(() => {
    if (activeTab === 'preview' && data.imageUrl && data.objects) {
      const pictureObjects = data.objects.filter(obj => 
        obj.type && obj.type.toLowerCase() === "picture" && obj.bbox
      );

      const processImages = async () => {
        const newProcessedImages = {};
        
        for (let i = 0; i < pictureObjects.length; i++) {
          const obj = pictureObjects[i];
          const [x1, y1, x2, y2] = obj.bbox;
          
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const imageEl = new Image();
            imageEl.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              imageEl.onload = resolve;
              imageEl.onerror = reject;
              imageEl.src = data.imageUrl;
            });
            
            // Set canvas size to the cropped area
            canvas.width = Math.abs(x2 - x1);
            canvas.height = Math.abs(y2 - y1);
            
            // Draw the cropped portion of the image
            ctx.drawImage(
              imageEl, 
              Math.min(x1, x2), Math.min(y1, y2), // Source x, y
              Math.abs(x2 - x1), Math.abs(y2 - y1), // Source width, height
              0, 0, // Destination x, y
              Math.abs(x2 - x1), Math.abs(y2 - y1) // Destination width, height
            );
            
            // Convert to data URL
            newProcessedImages[i] = canvas.toDataURL('image/png');
          } catch (error) {
            console.error('Error processing image:', error);
            newProcessedImages[i] = null;
          }
        }
        
        setProcessedImages(newProcessedImages);
      };
      
      processImages();
    }
  }, [activeTab, data.imageUrl, data.objects]);

  // Convert markdown to HTML with proper styling
  const markdownToHtml = (markdown) => {
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Lists
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
      // Images (replace with actual cropped image rendering)
      .replace(/!\[Picture (\d+)\]\(picture_(\d+)\.png\)/g, (match, num, index) => {
        const pictureIndex = parseInt(index) - 1; // Convert to 0-based index
        const processedImage = processedImages[pictureIndex];
        
        if (processedImage) {
          return `<div class="picture-container" style="margin: 0.5rem 0; text-align: center;"><img src="${processedImage}" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 0.375rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);" alt="Picture ${num}" /></div>`;
        } else {
          return `<div class="picture-placeholder" style="padding: 1rem; background-color: #f3f4f6; border: 1px dashed #d1d5db; border-radius: 0.375rem; text-align: center; color: #6b7280;">Picture ${num}</div>`;
        }
      })
      // Line breaks - handle images specially to avoid extra spacing
      .replace(/\n\n!\[Picture/g, '![Picture')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap in paragraphs
    html = `<p>${html}</p>`;
    
    return html;
  };

  const markdownContent = generateMarkdown(data);
  const htmlContent = markdownToHtml(markdownContent);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Markdown View</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600"
            title="Close"
            type="button"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('source')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'source'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            type="button"
          >
            Source
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'preview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            type="button"
          >
            Preview
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'source' ? (
            <div className="bg-gray-50 p-4 rounded border font-mono text-sm whitespace-pre-wrap">
              {markdownContent}
            </div>
          ) : (
            <div className="bg-white p-6 rounded border prose prose-lg max-w-none">
              <style>{`
                .prose h1 {
                  font-size: 2.25rem;
                  font-weight: 700;
                  color: #1f2937;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                  border-bottom: 2px solid #e5e7eb;
                  padding-bottom: 0.5rem;
                }
                .prose h2 {
                  font-size: 1.875rem;
                  font-weight: 600;
                  color: #374151;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                  border-bottom: 1px solid #f3f4f6;
                  padding-bottom: 0.25rem;
                }
                .prose h3 {
                  font-size: 1.5rem;
                  font-weight: 600;
                  color: #4b5563;
                  margin-top: 1.25rem;
                  margin-bottom: 0.5rem;
                }
                .prose blockquote {
                  border-left: 4px solid #3b82f6;
                  background-color: #f8fafc;
                  padding: 1rem;
                  margin: 1rem 0;
                  font-style: italic;
                  color: #475569;
                  border-radius: 0.375rem;
                }
                .prose ul {
                  margin: 1rem 0;
                  padding-left: 1.5rem;
                }
                .prose li {
                  margin: 0.5rem 0;
                  color: #374151;
                }
                .prose p {
                  margin: 1rem 0;
                  line-height: 1.75;
                  color: #374151;
                }
                .prose {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarkdownViewer;
