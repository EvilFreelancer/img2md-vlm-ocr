import React, { useRef } from "react";

// ImageUploader component with drag-and-drop and file preview tiles
function ImageUploader({ onUpload }) {
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
    if (files.length) onUpload(files);
  };

  const handleClick = () => {
    inputRef.current.click();
  };

  return (
    <div
      className="w-full max-w-xl mb-4 p-6 border-2 border-dashed border-blue-400 rounded-lg bg-white flex flex-col items-center cursor-pointer hover:bg-blue-50 transition"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="text-blue-600 font-semibold mb-2">Drag & Drop images here or click to select</div>
      <div className="text-gray-400 text-sm">Supported: PNG, JPG, JPEG, GIF, etc.</div>
    </div>
  );
}

export default ImageUploader;
