'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/utils/crop-image';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  displayName: string | null;
  userId: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel?: () => void;
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  userId,
  onCropComplete,
  onCancel,
  className,
}: AvatarUploadProps) {
  const { t } = useI18n();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URL on unmount or when imageSrc changes
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    // Clean up previous URL
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropAreaComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);

      // Clean up
      if (imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
      setImageSrc(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (imageSrc && imageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(imageSrc);
    }
    setImageSrc(null);
    onCancel?.();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Show cropper if image selected
  if (imageSrc) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaComplete}
          />
        </div>

        <div className="flex items-center gap-4">
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={([value]) => setZoom(value)}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Save Avatar'}
          </Button>
        </div>
      </div>
    );
  }

  // Show upload trigger (click avatar area to select file)
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={triggerFileInput}
        className="group relative block"
        aria-label="Upload avatar"
      >
        {/* Current avatar or placeholder */}
        <div className="relative">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={displayName || 'Current avatar'}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center text-2xl font-semibold text-white"
              style={{ backgroundColor: '#3B82F6' }}
            >
              {displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-sm font-medium">Change</span>
          </div>
        </div>
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('profile.avatarUploadHint')}
      </p>
    </div>
  );
}
