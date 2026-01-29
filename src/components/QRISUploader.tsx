import React, { useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QRISUploaderProps {
  onQrDecode: (data: string | null, error?: string) => void;
}

export const QRISUploader: React.FC<QRISUploaderProps> = ({ onQrDecode }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(png|jpe?g|gif)$/i)) {
      onQrDecode(null, 'Please upload a valid image file (PNG, JPG, or GIF)');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const context = canvas.getContext('2d');
          if (!context) return;

          canvas.width = image.width;
          canvas.height = image.height;
          context.drawImage(image, 0, 0, image.width, image.height);
          
          const imageData = context.getImageData(0, 0, image.width, image.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          setIsLoading(false);
          
          if (code && code.data) {
            // Validate if it's a QRIS (should contain specific patterns)
            if (code.data.includes('00020101') && code.data.includes('5802ID')) {
              onQrDecode(code.data);
            } else {
              onQrDecode(null, 'This QR code is not a valid QRIS format');
            }
          } else {
            onQrDecode(null, 'Could not find a QR code in the image');
          }
        } catch (error) {
          setIsLoading(false);
          onQrDecode(null, 'Error processing the image');
        }
      };
      
      image.onerror = () => {
        setIsLoading(false);
        onQrDecode(null, 'Failed to load the image');
      };
      
      image.src = result;
    };
    
    reader.onerror = () => {
      setIsLoading(false);
      onQrDecode(null, 'Failed to read the file');
    };
    
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={!isLoading ? handleUploadClick : undefined}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Scanning QR Code...</p>
          </div>
        ) : imagePreview ? (
          <div className="flex flex-col items-center">
            <img
              src={imagePreview}
              alt="QR Code Preview"
              className="max-w-full max-h-48 object-contain mb-4 rounded"
            />
            <p className="text-sm text-gray-600 mb-2">Click to upload a different image</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">Upload QRIS Image</p>
            <p className="text-sm text-gray-500">Drag and drop or click to select</p>
            <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, GIF</p>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};