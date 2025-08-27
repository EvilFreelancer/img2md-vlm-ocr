import React from "react";

// JsonViewer component for displaying JSON response
function JsonViewer({ data, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-lg max-w-3xl w-full max-h-[80vh] relative flex flex-col">
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b bg-white rounded-t">
          <h3 className="font-bold">JSON Response</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close JSON"
            title="Close"
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-auto">
          <pre className="overflow-x-auto text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default JsonViewer;
