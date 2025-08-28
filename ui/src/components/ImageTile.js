import React from "react";
import Loader from "./Loader";

// ImageTile component for preview grid
function ImageTile({
  img,
  isSelected,
  isLoading,
  onClick,
  onReload,
}) {
  const isError = img.status === "error";
  
  const handleReloadClick = (e) => {
    e.stopPropagation(); // Prevent modal opening
    if (onReload) {
      onReload();
    }
  };
  
  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-lg border-2 transition-all duration-200 w-28 h-32 select-none ${
        isLoading 
          ? "border-gray-300 bg-gray-100 cursor-wait" 
          : isError
          ? "border-red-300 bg-red-50 cursor-default"
          : "border-gray-200 bg-white cursor-pointer hover:shadow-lg"
      } ${isSelected ? "border-blue-500 bg-blue-50" : ""}`}
      onClick={isLoading || isError ? undefined : onClick}
      tabIndex={isLoading || isError ? -1 : 0}
    >
      <div className="relative w-20 h-20 flex items-center justify-center mb-1">
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <div 
            className="w-20 h-20 flex items-center justify-center bg-red-100 rounded cursor-pointer hover:bg-red-200 transition-colors"
            onClick={handleReloadClick}
            title="Click to retry"
          >
            <svg 
              className="w-6 h-6 text-red-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </div>
        ) : (
          <img
            src={img.url}
            alt={img.file.name}
            className="w-20 h-20 object-cover rounded"
            draggable={false}
          />
        )}
      </div>
      <span className="text-xs text-gray-600 truncate w-full text-center" title={img.file.name}>
        {img.file.name.length > 16 ? img.file.name.slice(0, 7) + "..." + img.file.name.slice(-6) : img.file.name}
      </span>
    </div>
  );
}

export default ImageTile; 