import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, Check, Sparkles, Move, RefreshCw } from 'lucide-react';

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1, // 1 for 1:1 square/circle
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = useState('');
  const [processing, setProcessing] = useState(false);

  // Reset controls when new image is loaded
  useEffect(() => {
    if (imageSrc && isOpen) {
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [imageSrc, isOpen]);

  // Draw crop onto hidden/preview canvas
  const drawCanvas = useCallback(() => {
    if (!imageRef.current || !canvasRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    const size = 320; // Internal crop resolution
    canvas.width = size;
    canvas.height = size / aspectRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply zoom
    ctx.scale(zoom, zoom);
    // Apply pan (adjusting for rotation)
    const rad = (-rotation * Math.PI) / 180;
    const rotatedPanX = pan.x * Math.cos(rad) - pan.y * Math.sin(rad);
    const rotatedPanY = pan.x * Math.sin(rad) + pan.y * Math.cos(rad);
    ctx.translate(rotatedPanX, rotatedPanY);

    // Calculate base fit dimensions
    const imgAspect = img.width / img.height;
    let drawW, drawH;
    if (imgAspect > 1) {
      drawH = canvas.height;
      drawW = canvas.height * imgAspect;
    } else {
      drawW = canvas.width;
      drawH = canvas.width / imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Update real-time preview data URL
    setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
  }, [imageLoaded, zoom, rotation, pan, aspectRatio]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.8), 3.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleConfirmCrop = async () => {
    if (!canvasRef.current) return;
    setProcessing(true);

    try {
      // Export high-quality blob from canvas
      const highResCanvas = document.createElement('canvas');
      const exportSize = 600; // High resolution output
      highResCanvas.width = exportSize;
      highResCanvas.height = exportSize / aspectRatio;
      const ctx = highResCanvas.getContext('2d');
      const img = imageRef.current;

      ctx.save();
      ctx.translate(highResCanvas.width / 2, highResCanvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      
      const scaleFactor = exportSize / 320;
      const rad = (-rotation * Math.PI) / 180;
      const rotatedPanX = (pan.x * scaleFactor) * Math.cos(rad) - (pan.y * scaleFactor) * Math.sin(rad);
      const rotatedPanY = (pan.x * scaleFactor) * Math.sin(rad) + (pan.y * scaleFactor) * Math.cos(rad);
      ctx.translate(rotatedPanX, rotatedPanY);

      const imgAspect = img.width / img.height;
      let drawW, drawH;
      if (imgAspect > 1) {
        drawH = highResCanvas.height;
        drawW = highResCanvas.height * imgAspect;
      } else {
        drawW = highResCanvas.width;
        drawH = highResCanvas.width / imgAspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      highResCanvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'room-logo-cropped.jpg', { type: 'image/jpeg' });
          onCropComplete(croppedFile, previewUrl);
          onClose();
        }
        setProcessing(false);
      }, 'image/jpeg', 0.92);
    } catch (err) {
      console.error('Failed to export crop:', err);
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-[#141417] text-white rounded-3xl sm:rounded-[2rem] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-echo-yellow" />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">Crop & Adjust Image</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Cropping Canvas Viewport */}
          <div 
            className="relative w-full aspect-square max-w-[320px] mx-auto bg-black/60 rounded-2xl overflow-hidden border-2 border-dashed border-echo-yellow/40 flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-inner"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Hidden export canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Circular Crop Guide Mask */}
            <div className="absolute inset-0 pointer-events-none border-2 border-echo-yellow/80 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] z-10" />

            {/* Hint overlay */}
            <div className="absolute top-2 left-2 z-20 pointer-events-none bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-300 flex items-center gap-1">
              <Move size={11} className="text-echo-yellow" /> Drag to position
            </div>

            {/* Rendered Live Image Canvas View */}
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Crop preview" 
                className="w-full h-full object-contain pointer-events-none"
              />
            )}
          </div>

          {/* Controls: Zoom & Rotate */}
          <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.8))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-echo-yellow cursor-pointer h-1.5 bg-white/15 rounded-lg"
              />
              <button 
                type="button"
                onClick={() => setZoom(prev => Math.min(prev + 0.15, 3.0))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <span className="text-xs font-bold text-gray-300 min-w-[38px] text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Action buttons: Rotate & Reset */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <RotateCw size={13} className="text-echo-yellow" />
                Rotate 90°
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Reset
              </button>
            </div>
          </div>

          {/* Live Output Previews (Circle & Rounded Square) */}
          <div className="flex items-center justify-center gap-6 pt-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-echo-yellow shadow-md bg-black/40">
                {previewUrl && <img src={previewUrl} alt="Circle Preview" className="w-full h-full object-cover" />}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avatar</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="w-20 h-14 rounded-xl overflow-hidden border-2 border-echo-yellow/80 shadow-md bg-black/40">
                {previewUrl && <img src={previewUrl} alt="Card Preview" className="w-full h-full object-cover" />}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Card Banner</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-[#0e0e11] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-300 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={processing || !imageLoaded}
            className="px-5 py-2.5 rounded-full bg-echo-yellow text-[#1a1a1a] font-bold text-xs shadow-md hover:bg-yellow-400 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {processing ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Check size={15} strokeWidth={2.5} />
            )}
            Crop & Apply
          </button>
        </div>

      </div>
    </div>
  );
}
