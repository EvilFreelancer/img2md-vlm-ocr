import React, {useRef, useEffect, useState} from "react";
import {EyeIcon, EyeOffIcon, CloseIcon} from "./icons";

// Color palette for labels
const LABEL_COLORS = [
    "#ef4444", // red
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e42", // orange
    "#a855f7", // purple
    "#eab308", // yellow
    "#14b8a6", // teal
    "#6366f1", // indigo
    "#f43f5e", // pink
    "#84cc16", // lime
];

function getLabelColor(label) {
    let hash = 0;
    for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
    return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

// ImageModal component for viewing image with bbox overlay
function ImageModal({image, objects, fileName, onClose, onShowJson, onShowMarkdown, onDownloadZip}) {
    const canvasRef = useRef(null);
    const [showBbox, setShowBbox] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    const [hasChanges, setHasChanges] = useState(false);

    // Zoom controls
    const handleZoomIn = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Zoom towards center of canvas
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            const newZoom = Math.min(zoom * 1.5, 5);
            const zoomRatio = newZoom / zoom;
            const newPanX = centerX - (centerX - panOffset.x) * zoomRatio;
            const newPanY = centerY - (centerY - panOffset.y) * zoomRatio;
            
            setZoom(newZoom);
            setPanOffset({x: newPanX, y: newPanY});
            setHasChanges(true);
        }
    };
    
    const handleZoomOut = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Zoom towards center of canvas
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            const newZoom = Math.max(zoom / 1.5, 0.5);
            const zoomRatio = newZoom / zoom;
            const newPanX = centerX - (centerX - panOffset.x) * zoomRatio;
            const newPanY = centerY - (centerY - panOffset.y) * zoomRatio;
            
            setZoom(newZoom);
            setPanOffset({x: newPanX, y: newPanY});
            setHasChanges(true);
        }
    };
    const handleResetZoom = () => {
        setZoom(1);
        setPanOffset({x: 0, y: 0});
        setHasChanges(false);
    };

    // Pan controls
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - panOffset.x,
            y: e.clientY - panOffset.y
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const newPanX = e.clientX - dragStart.x;
            const newPanY = e.clientY - dragStart.y;
            setPanOffset({x: newPanX, y: newPanY});
            setHasChanges(true);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Get cursor style based on dragging state
    const getCursorStyle = () => {
        if (isDragging) return "grabbing";
        return "grab";
    };

    useEffect(() => {
        if (!image) return;

        const img = new window.Image();
        img.src = image;

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // 1. Получаем доступные размеры контейнера
            const container = canvas.parentElement;
            const maxWidth = container.offsetWidth;
            const maxHeight = window.innerHeight * 0.7;

            // 2. Сохраняем пропорции изображения
            const scaleRatio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
            const displayWidth = img.width * scaleRatio;
            const displayHeight = img.height * scaleRatio;

            // 3. Устанавливаем canvas в соответствии с отображением (интринсик + CSS размеры одинаковые)
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            canvas.style.width = `${displayWidth}px`;
            canvas.style.height = `${displayHeight}px`;

            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Apply zoom and pan transformations
            ctx.save();
            ctx.translate(panOffset.x, panOffset.y);
            ctx.scale(zoom, zoom);
            
            ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

            // 4. Отрисовываем bbox пропорционально масштабу
            if (showBbox && Array.isArray(objects)) {
                objects.forEach((obj) => {
                    const [x1, y1, x2, y2] = obj.bbox || obj.bbox_2d;
                    const x = Math.min(x1, x2) * scaleRatio;
                    const y = Math.min(y1, y2) * scaleRatio;
                    const w = Math.abs(x2 - x1) * scaleRatio;
                    const h = Math.abs(y2 - y1) * scaleRatio;

                    const color = getLabelColor(obj.label || "bbox");
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);

                    if (obj.label) {
                        const padding = 4;
                        ctx.font = "14px Arial";
                        const textWidth = ctx.measureText(obj.label).width;
                        const textHeight = 16;
                        ctx.fillStyle = "white";
                        ctx.fillRect(x, y - textHeight, textWidth + padding * 2, textHeight);
                        ctx.fillStyle = color;
                        ctx.fillText(obj.label, x + padding, y - 4);
                    }
                });
            }
            
            ctx.restore();
        };
    }, [image, objects, showBbox, zoom, panOffset]);

    // Add wheel event listener with passive: false
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const wheelHandler = (e) => {
            e.preventDefault();
            
            // Get mouse position relative to canvas
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(0.5, Math.min(5, zoom * delta));
            
            if (newZoom !== zoom) {
                // Calculate new pan offset to zoom towards mouse position
                const zoomRatio = newZoom / zoom;
                const newPanX = mouseX - (mouseX - panOffset.x) * zoomRatio;
                const newPanY = mouseY - (mouseY - panOffset.y) * zoomRatio;
                
                setZoom(newZoom);
                setPanOffset({x: newPanX, y: newPanY});
                setHasChanges(true);
            }
        };

        canvas.addEventListener('wheel', wheelHandler, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', wheelHandler);
        };
    }, [zoom, panOffset]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full flex flex-col items-center">
                {/* Header: filename left, close button right */}
                <div className="w-full flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500 truncate" title={fileName}>{fileName}</div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-600"
                        title="Close"
                        type="button"
                    >
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                
                <div className="w-full flex justify-center items-center overflow-auto max-h-[70vh]">
                    <canvas
                        ref={canvasRef}
                        className="border rounded"
                        style={{ cursor: getCursorStyle() }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        title="Drag to pan, scroll to zoom"
                    />
                </div>
                
                {/* Footer: actions left, zoom controls right */}
                <div className="w-full flex items-center justify-between mt-2">
                    {/* Left side: action buttons */}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showBbox}
                                onChange={() => setShowBbox((v) => !v)}
                                className="hidden"
                            />
                            {showBbox ? <EyeIcon className="w-5 h-5 text-blue-600"/> :
                                <EyeOffIcon className="w-5 h-5 text-gray-400"/>}
                            <span className="text-xs text-gray-700">Show bbox</span>
                        </label>
                        <button onClick={onShowJson} title="Show JSON" type="button" className="text-xs text-gray-700 hover:underline text-sm">
                            Show JSON
                        </button>
                        <button onClick={onShowMarkdown} title="Show Markdown" type="button" className="text-xs text-gray-700 hover:underline text-sm">
                            Show Markdown
                        </button>
                        <button onClick={onDownloadZip} title="Download" type="button" className="text-xs text-green-700 hover:underline text-sm">
                            Download
                        </button>
                    </div>
                    
                    {/* Right side: zoom controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomOut}
                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            title="Zoom Out"
                            type="button"
                        >
                            -
                        </button>
                        <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <button
                            onClick={handleZoomIn}
                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                            title="Zoom In"
                            type="button"
                        >
                            +
                        </button>
                        <button
                            onClick={handleResetZoom}
                            disabled={!hasChanges}
                            className={`px-2 py-1 rounded text-sm ${
                                !hasChanges 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-200 hover:bg-blue-300 text-blue-700'
                            }`}
                            title="Reset Zoom"
                            type="button"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ImageModal;