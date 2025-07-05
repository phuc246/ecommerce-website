'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/Button';

export interface AspectRatioOption {
  value: string; // e.g., '1', '1.333', 'circle'
  label: string; // e.g., 'Vuông', '4:3', 'Tròn'
}

interface ImageCropperProps {
  image: string;
  onCropDone: (cropped: string, shape: 'rect' | 'circle') => void;
  onCancel: () => void;
  aspectRatioOptions: AspectRatioOption[];
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getCroppedImg(imageSrc: string, crop: CropArea, isCircle: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        const image = new window.Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            canvas.width = crop.width;
            canvas.height = crop.height;
            
            if (isCircle) {
                ctx.beginPath();
                ctx.arc(crop.width / 2, crop.height / 2, crop.width / 2, 0, Math.PI * 2, true);
                ctx.clip();
            }

            ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

            resolve(canvas.toDataURL('image/png', 0.95));
        };
        image.onerror = (error) => reject(error);
    });
}


const ImageCropper: React.FC<ImageCropperProps> = ({ image, onCropDone, onCancel, aspectRatioOptions }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<string>(aspectRatioOptions[0]?.value || '1');

  const onCropComplete = useCallback((_: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
        const isCircle = selectedRatio === 'circle';
        const cropped = await getCroppedImg(image, croppedAreaPixels, isCircle);
        onCropDone(cropped, isCircle ? 'circle' : 'rect');
    } catch (e) {
        console.error("Error cropping image:", e);
    } finally {
        setLoading(false);
    }
  };
  
  const isCircle = selectedRatio === 'circle';
  const aspect = isCircle ? 1 : Number(selectedRatio);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full flex flex-col">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Cắt & Chỉnh sửa ảnh</h3>
        
        <div className="relative w-full h-[50vw] max-h-[60vh] min-h-[300px] bg-gray-200 rounded-lg overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={isCircle ? 'round' : 'rect'}
            showGrid={!isCircle}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 items-center mt-4">
             <label className="flex flex-col gap-1 text-sm">
                <span>Zoom</span>
                <input
                  type="range" min={1} max={3} step={0.01}
                  value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </label>
            <label className="flex flex-col gap-1 text-sm">
                <span>Tỉ lệ</span>
                <select
                    value={selectedRatio}
                    onChange={e => setSelectedRatio(e.target.value)}
                    className="w-full border rounded-md px-2 py-1.5 bg-white"
                    aria-label="Tỉ lệ khung cắt"
                >
                    {aspectRatioOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </label>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Hủy</Button>
          <Button onClick={handleDone} disabled={loading}>{loading ? 'Đang xử lý...' : 'Xác nhận'}</Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper; 