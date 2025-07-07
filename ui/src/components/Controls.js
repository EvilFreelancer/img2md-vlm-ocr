import React from "react";

// Controls component for actions: repeat, download, show JSON
function Controls({ onRepeat, onDownload, onShowJson, disabled }) {
  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={onRepeat}
        disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Repeat
      </button>
      <button
        onClick={onDownload}
        disabled={disabled}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Download
      </button>
      <button
        onClick={onShowJson}
        disabled={disabled}
        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
      >
        Show JSON
      </button>
    </div>
  );
}

export default Controls;
