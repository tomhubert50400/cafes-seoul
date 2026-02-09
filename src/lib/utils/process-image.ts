/**
 * Client-side image processing utility
 * Resizes and converts images to WebP for optimized uploads
 */

const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 0.92;
const JPEG_QUALITY = 0.90;

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  size: number;
  mimeType: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.addEventListener('load', () => {
      URL.revokeObjectURL(url);
      resolve(img);
    });
    img.addEventListener('error', (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    });
    img.src = url;
  });
}

function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Process an image file: resize to max 2400px (longest side) and convert to WebP
 * Falls back to JPEG if WebP is not supported
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const img = await loadImage(file);

  let { width, height } = img;

  // Scale down if either dimension exceeds MAX_DIMENSION
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  const useWebP = supportsWebP();
  const mimeType = useWebP ? 'image/webp' : 'image/jpeg';
  const quality = useWebP ? WEBP_QUALITY : JPEG_QUALITY;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      mimeType,
      quality
    );
  });

  return {
    blob,
    width,
    height,
    size: blob.size,
    mimeType,
  };
}
