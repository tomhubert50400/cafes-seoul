'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, ImageIcon, AlertCircle, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import {
  validatePhotoFile,
  formatFileSize,
} from '@/lib/photos/validation';
import { processImage } from '@/lib/utils/process-image';
import {
  uploadPhotoWithProgress,
  insertPhotoRecord,
  checkAllUploadLimits,
} from '@/lib/photos/upload';
import { createClient } from '@/lib/supabase/client';

const MAX_FILES = 3;

export interface PhotoUploadModalProps {
  /** Cafe ID to upload photos to */
  cafeId: string;
  /** Callback when upload succeeds */
  onUploadSuccess?: () => void;
  /** Disable the upload component */
  disabled?: boolean;
  /** Whether the modal should be open by default */
  defaultOpen?: boolean;
}

interface UploadState {
  selectedFiles: File[];
  uploadProgress: number;
  currentFileIndex: number;
  isUploading: boolean;
  isProcessing: boolean;
  errors: string[];
  limitInfo: {
    remainingDaily: number;
    remainingCafe: number;
  } | null;
}

export function PhotoUploadModal({ cafeId, onUploadSuccess, disabled = false, defaultOpen = false }: PhotoUploadModalProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(defaultOpen);

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [state, setState] = useState<UploadState>({
    selectedFiles: [],
    uploadProgress: 0,
    currentFileIndex: 0,
    isUploading: false,
    errors: [],
    limitInfo: null,
  });

  // Fetch limit info on mount and subscribe to auth state changes
  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      setAuthLoading(false);

      if (user) {
        checkAllUploadLimits(supabase, user.id, cafeId).then((limitCheck) => {
          if (limitCheck.canUpload) {
            setState((prev) => ({
              ...prev,
              limitInfo: {
                remainingDaily: limitCheck.remainingDaily ?? 10,
                remainingCafe: limitCheck.remainingCafe ?? 3,
              },
            }));
          }
        });
      }
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [cafeId]);

  // Max files allowed based on remaining limits
  const maxAllowed = state.limitInfo
    ? Math.min(MAX_FILES, state.limitInfo.remainingCafe, state.limitInfo.remainingDaily)
    : MAX_FILES;

  // Handle file selection
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files;
      if (!fileList || fileList.length === 0) return;

      // Use tracked userId instead of calling getUser()
      if (!userId) {
        setState((prev) => ({
          ...prev,
          errors: ['Please sign in to upload photos'],
        }));
        return;
      }

      const supabase = createClient();
      const limitCheck = await checkAllUploadLimits(supabase, userId, cafeId);

      if (!limitCheck.canUpload) {
        setState((prev) => ({
          ...prev,
          selectedFiles: [],
          errors: [limitCheck.reason || 'Upload limit reached'],
        }));
        return;
      }

      const allowed = Math.min(
        MAX_FILES,
        limitCheck.remainingCafe ?? 3,
        limitCheck.remainingDaily ?? 10
      );

      const files = Array.from(fileList).slice(0, allowed);

      // Validate each file
      const errors: string[] = [];
      const validFiles: File[] = [];

      for (const file of files) {
        const validation = validatePhotoFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.errors.join(', ')}`);
        }
      }

      if (fileList.length > allowed) {
        errors.push(`You can only upload ${allowed} more photo${allowed !== 1 ? 's' : ''} for this cafe`);
      }

      setState((prev) => ({
        ...prev,
        selectedFiles: validFiles,
        errors,
        uploadProgress: 0,
        currentFileIndex: 0,
      }));
    },
    [cafeId, userId]
  );

  // Remove a single file from selection
  const handleRemoveFile = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((_, i) => i !== index),
      errors: [],
    }));
  }, []);

  // Clear all selected files
  const handleClearFiles = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedFiles: [],
      errors: [],
      uploadProgress: 0,
      currentFileIndex: 0,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (state.selectedFiles.length === 0) return;

    if (!userId) {
      toast.error('Please sign in to upload photos');
      return;
    }

    setState((prev) => ({ ...prev, isUploading: true, errors: [], currentFileIndex: 0 }));

    const supabase = createClient();
    const totalFiles = state.selectedFiles.length;
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < totalFiles; i++) {
      const file = state.selectedFiles[i];
      setState((prev) => ({ ...prev, currentFileIndex: i }));

      try {
        // Upload to storage with progress
        const uploadResult = await uploadPhotoWithProgress(
          supabase,
          file,
          cafeId,
          userId,
          (progress) => {
            const fileProgress = (i + progress / 100) / totalFiles * 100;
            setState((prev) => ({ ...prev, uploadProgress: fileProgress }));
          }
        );

        if (uploadResult.error) {
          errors.push(`${file.name}: ${uploadResult.error}`);
          continue;
        }

        // Insert database record
        const insertResult = await insertPhotoRecord(supabase, {
          cafeId,
          userId,
          storagePath: uploadResult.path,
          fileSize: file.size,
          mimeType: file.type,
        });

        if (!insertResult.success) {
          errors.push(`${file.name}: ${insertResult.error ?? 'Failed to save photo'}`);
          continue;
        }

        successCount++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        errors.push(`${file.name}: ${message}`);
      }
    }

    // Show result toast
    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? 'Photo uploaded successfully! It will be reviewed shortly.'
          : `${successCount} photos uploaded successfully! They will be reviewed shortly.`
      );
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} photo${errors.length !== 1 ? 's' : ''} failed to upload`);
    }

    // Reset form
    setState((prev) => ({
      ...prev,
      selectedFiles: [],
      isUploading: false,
      uploadProgress: 0,
      currentFileIndex: 0,
      errors,
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Update limit info
    const limitCheck = await checkAllUploadLimits(supabase, userId, cafeId);
    if (limitCheck.canUpload) {
      setState((prev) => ({
        ...prev,
        limitInfo: {
          remainingDaily: limitCheck.remainingDaily ?? 10,
          remainingCafe: limitCheck.remainingCafe ?? 3,
        },
      }));
    } else {
      setState((prev) => ({ ...prev, limitInfo: null }));
    }

    // Close modal and call success callback if any succeeded
    if (successCount > 0) {
      setOpen(false);
      onUploadSuccess?.();
    }
  }, [state.selectedFiles, cafeId, userId, onUploadSuccess]);

  // Trigger file input click
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Check if upload should be disabled
  const isUploadDisabled =
    disabled ||
    authLoading ||
    state.isUploading ||
    state.selectedFiles.length === 0 ||
    !userId ||
    (state.limitInfo !== null &&
      (state.limitInfo.remainingDaily <= 0 || state.limitInfo.remainingCafe <= 0));

  // Reset state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setState((prev) => ({
        ...prev,
        selectedFiles: [],
        errors: [],
        uploadProgress: 0,
        currentFileIndex: 0,
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t('photos.addPhoto') || 'Add Photo'}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t('photos.upload.title') || 'Upload Photos'}
          </DialogTitle>
          <DialogDescription>
            {t('photos.upload.description') || 'Share photos of this cafe. Photos will be reviewed before appearing publicly.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Limit Information */}
          {state.limitInfo && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">
                  {state.limitInfo.remainingCafe}
                </span>
                <span>of 3 photos for this cafe</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="font-medium text-foreground">
                  {state.limitInfo.remainingDaily}
                </span>
                <span>uploads remaining today</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {state.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  {state.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* File Selection Area */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || state.isUploading}
            />

            {state.selectedFiles.length === 0 ? (
              <Button
                type="button"
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={triggerFileInput}
                disabled={disabled || state.isUploading}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('photos.upload.select') || `Click to select photos (up to ${maxAllowed})`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, or WebP (max 5MB each)
                  </span>
                </div>
              </Button>
            ) : (
              <div className="space-y-2">
                {state.selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative border rounded-lg p-3 bg-muted/50">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={state.isUploading}
                      className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-background flex items-center justify-center shrink-0">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate pr-6">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    {/* Per-file progress indicator */}
                    {state.isUploading && state.currentFileIndex === index && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{
                              width: `${Math.max(0, (state.uploadProgress - (index / state.selectedFiles.length) * 100) / (1 / state.selectedFiles.length) / 100 * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {state.isUploading && state.currentFileIndex > index && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary w-full" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add more button if under limit */}
                {!state.isUploading && state.selectedFiles.length < maxAllowed && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={triggerFileInput}
                  >
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Add more ({state.selectedFiles.length}/{maxAllowed})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Overall Progress Bar */}
          {state.isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Uploading {state.currentFileIndex + 1} of {state.selectedFiles.length}...
                </span>
                <span className="font-medium">{Math.round(state.uploadProgress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${state.uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            type="button"
            className="w-full"
            onClick={handleUpload}
            disabled={isUploadDisabled}
          >
            {state.isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {state.selectedFiles.length > 1
                  ? `Upload ${state.selectedFiles.length} Photos`
                  : (t('photos.upload.title') || 'Upload Photo')}
              </>
            )}
          </Button>

          {/* Guidelines */}
          <p className="text-xs text-muted-foreground text-center">
            {t('photos.upload.disclaimer') || 'By uploading, you agree that your photos will be reviewed for quality and relevance. Approved photos will be visible to all users.'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
