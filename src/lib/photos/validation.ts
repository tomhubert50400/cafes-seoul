/**
 * Photo file validation utilities
 * Validates file type, size, and format for cafe photo uploads
 */

// ============================================
// CONSTANTS
// ============================================

/** Maximum file size: 15MB */
export const MAX_FILE_SIZE = 15 * 1024 * 1024;

/** Allowed MIME types for photo uploads */
export const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** Allowed file extensions (including variations) */
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

// ============================================
// TYPES
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate a photo file for upload
 * Checks file size and MIME type
 * @param file - The File object to validate
 * @returns ValidationResult with valid flag and error messages
 */
export function validatePhotoFile(file: File): ValidationResult {
  const errors: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push('File must be less than 5MB');
  }

  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
    errors.push('Only JPG, PNG, and WebP images are allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple photo files
 * Returns validation results for each file
 * @param files - Array of File objects to validate
 * @returns Map of file names to validation results
 */
export function validateMultiplePhotoFiles(
  files: File[]
): Map<string, ValidationResult> {
  const results = new Map<string, ValidationResult>();

  for (const file of files) {
    results.set(file.name, validatePhotoFile(file));
  }

  return results;
}

/**
 * Check if a file has an allowed extension
 * @param filename - The filename to check
 * @returns boolean indicating if extension is allowed
 */
export function hasAllowedExtension(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lowerFilename.endsWith(ext));
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns The extension including the dot, or empty string if none
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot).toLowerCase();
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB", "800 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Format file size with comparison to max size
 * Shows both current and max size
 * @param bytes - Current file size in bytes
 * @returns Formatted string (e.g., "2.5 MB / 5 MB")
 */
export function formatFileSizeWithLimit(bytes: number): string {
  return `${formatFileSize(bytes)} / ${formatFileSize(MAX_FILE_SIZE)}`;
}

// ============================================
// FILE INFO UTILITIES
// ============================================

/**
 * Get MIME type from file extension
 * Used as fallback when browser MIME type detection fails
 * @param filename - The filename
 * @returns MIME type string or empty string if unknown
 */
export function getMimeTypeFromExtension(filename: string): string {
  const ext = getFileExtension(filename);

  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };

  return mimeMap[ext] || '';
}

/**
 * Check if file is an image based on MIME type or extension
 * @param file - The File object to check
 * @returns boolean indicating if file appears to be an image
 */
export function isImageFile(file: File): boolean {
  // First check MIME type
  if (file.type.startsWith('image/')) {
    return true;
  }

  // Fallback to extension check
  return hasAllowedExtension(file.name);
}
