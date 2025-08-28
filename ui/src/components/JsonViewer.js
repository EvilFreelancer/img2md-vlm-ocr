import React from "react";
import { CloseIcon } from "./icons";

// JsonViewer component for displaying JSON response
function JsonViewer({ data, onClose }) {

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">JSON View</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600"
            title="Close"
            type="button"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="bg-gray-50 p-4 rounded border font-mono text-sm">
            <pre className="whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
        

      </div>
    </div>
  );
}

export default JsonViewer;
