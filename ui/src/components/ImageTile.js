import React from "react";
import { DownloadIcon, RefreshIcon, JsonIcon } from "./icons";
import Loader from "./Loader";

// ImageTile component for preview grid
function ImageTile({
  img,
  isSelected,
  isLoading,
  onClick,
  onDownload,
  onRepeat,
  onShowJson,
}) {
  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer transition w-28 h-32 select-none ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}
      onClick={onClick}
      tabIndex={0}
    >
      <div className="relative w-20 h-20 flex items-center justify-center mb-1">
        {isLoading ? (
          <Loader />
        ) : (
          <img
            src={img.url}
            alt={img.file.name}
            className="w-20 h-20 object-cover rounded"
            draggable={false}
          />
        )}
        {/* Action icons overlay */}
        {!isLoading && img.result && (
          <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
            <button
              type="button"
              title="Download"
              className="bg-white rounded-full p-1 shadow hover:bg-blue-100"
              onClick={e => { e.stopPropagation(); onDownload(); }}
            >
              <DownloadIcon className="w-4 h-4 text-blue-600" />
            </button>
            <button
              type="button"
              title="Repeat"
              className="bg-white rounded-full p-1 shadow hover:bg-yellow-100"
              onClick={e => { e.stopPropagation(); onRepeat(); }}
            >
              <RefreshIcon className="w-4 h-4 text-yellow-600" />
            </button>
            <button
              type="button"
              title="Show JSON"
              className="bg-white rounded-full p-1 shadow hover:bg-gray-100"
              onClick={e => { e.stopPropagation(); onShowJson(); }}
            >
              <JsonIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>
      <span className="text-xs text-gray-600 truncate w-full text-center" title={img.file.name}>
        {img.file.name.length > 18 ? img.file.name.slice(0, 8) + "..." + img.file.name.slice(-7) : img.file.name}
      </span>
    </div>
  );
}

export default ImageTile; 