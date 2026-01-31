'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';
import {
  validatePhotoFile,
  formatFileSize,
} from '@/lib/photos/validation';
import {
  uploadPhotoWithProgress,
  insertPhotoRecord,
  checkAllUploadLimits,
} from '@/lib/photos/upload';
import { createClient } from '@/lib/supabase/client';

export interface PhotoUploadProps {
  /** Cafe ID to upload photos to */
  cafeId: string;
  /** Callback when upload succeeds */
  onUploadSuccess?: () => void;
  /** Disable the upload component */
  disabled?: boolean;
}

interface UploadState {
  selectedFile: File | null;
  uploadProgress: number;
  isUploading: boolean;
  errors: string[];
  limitInfo: {
    remainingDaily: number;
    remainingCafe: number;
  } | null;
}

export function PhotoUpload({ cafeId, onUploadSuccess, disabled = false }: PhotoUploadProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [state, setState] = useState<UploadState>({
    selectedFile: null,
    uploadProgress: 0,
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

  // Handle file selection
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      // Validate file
      const validation = validatePhotoFile(file);

      if (!validation.valid) {
        setState((prev) => ({
          ...prev,
          selectedFile: null,
          errors: validation.errors,
        }));
        return;
      }

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
          selectedFile: null,
          errors: [limitCheck.reason || 'Upload limit reached'],
        }));
        return;
      }

      // File is valid and within limits
      setState((prev) => ({
        ...prev,
        selectedFile: file,
        errors: [],
        uploadProgress: 0,
      }));
    },
    [cafeId, userId]
  );

  // Clear selected file
  const handleClearFile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedFile: null,
      errors: [],
      uploadProgress: 0,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!state.selectedFile) return;

    // Use tracked userId instead of calling getUser()
    if (!userId) {
      toast.error('Please sign in to upload photos');
      return;
    }

    setState((prev) => ({ ...prev, isUploading: true, errors: [] }));

    const supabase = createClient();

    try {
      // Upload to storage with progress
      const uploadResult = await uploadPhotoWithProgress(
        supabase,
        state.selectedFile,
        cafeId,
        userId,
        (progress) => {
          setState((prev) => ({ ...prev, uploadProgress: progress }));
        }
      );

      if (uploadResult.error) {
        const errorMsg = uploadResult.error ?? 'Upload failed';
        setState((prev) => ({
          ...prev,
          isUploading: false,
          errors: [errorMsg],
        }));
        toast.error(errorMsg);
        return;
      }

      // Insert database record
      const insertResult = await insertPhotoRecord(supabase, {
        cafeId,
        userId: userId,
        storagePath: uploadResult.path,
        fileSize: state.selectedFile.size,
        mimeType: state.selectedFile.type,
      });

      if (!insertResult.success) {
        const errorMsg = insertResult.error ?? 'Failed to save photo';
        setState((prev) => ({
          ...prev,
          isUploading: false,
          errors: [errorMsg],
        }));
        toast.error(errorMsg);
        return;
      }

      // Success!
      toast.success('Photo uploaded successfully! It will be reviewed shortly.');

      // Reset form
      setState((prev) => ({
        ...prev,
        selectedFile: null,
        isUploading: false,
        uploadProgress: 0,
        errors: [],
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

      // Call success callback
      onUploadSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setState((prev) => ({
        ...prev,
        isUploading: false,
        errors: [message],
      }));
      toast.error(message);
    }
  }, [state.selectedFile, cafeId, userId, onUploadSuccess]);

  // Trigger file input click
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Check if upload should be disabled
  const isUploadDisabled =
    disabled ||
    authLoading ||
    state.isUploading ||
    !state.selectedFile ||
    !userId ||
    (state.limitInfo !== null &&
      (state.limitInfo.remainingDaily <= 0 || state.limitInfo.remainingCafe <= 0));

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Upload Photo
        </CardTitle>
        <CardDescription>
          Share a photo of this cafe. Photos will be reviewed before appearing publicly.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || state.isUploading}
          />

          {!state.selectedFile ? (
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
                  Click to select a photo
                </span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG, or WebP (max 5MB)
                </span>
              </div>
            </Button>
          ) : (
            <div className="relative border rounded-lg p-4 bg-muted/50">
              <button
                type="button"
                onClick={handleClearFile}
                disabled={state.isUploading}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-background flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {state.selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(state.selectedFile.size)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {state.isUploading && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Uploading...</span>
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
            </div>
          )}
        </div>

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
              Upload Photo
            </>
          )}
        </Button>

        {/* Guidelines */}
        <p className="text-xs text-muted-foreground text-center">
          By uploading, you agree that your photo will be reviewed for quality and
          relevance. Approved photos will be visible to all users.
        </p>
      </CardContent>
    </Card>
  );
}
