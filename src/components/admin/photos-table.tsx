'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, X, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { approvePhoto } from '@/lib/actions/admin';
import { PhotoPreviewModal } from './photo-preview-modal';
import { RejectPhotoModal } from './reject-photo-modal';
import type { PendingPhoto } from '@/lib/actions/admin';

interface PhotosTableProps {
  photos: PendingPhoto[];
  storageUrl: string;
  translations: {
    preview: string;
    approve: string;
    reject: string;
    empty: string;
  };
}

export function PhotosTable({ photos, storageUrl, translations }: PhotosTableProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PendingPhoto | null>(null);
  const [rejectingPhoto, setRejectingPhoto] = useState<PendingPhoto | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = async (photoId: string) => {
    setApprovingId(photoId);
    startTransition(async () => {
      const result = await approvePhoto(photoId);
      if (result.success) {
        toast.success('Photo approved');
      } else {
        toast.error(result.error || 'Failed to approve photo');
      }
      setApprovingId(null);
    });
  };

  const getPhotoUrl = (storagePath: string, width?: number, quality: number = 75) => {
    const transformParams = width ? `?width=${width}&height=${width}&resize=cover&quality=${quality}` : '';
    return `${storageUrl}/storage/v1/object/public/cafe-images/${storagePath}${transformParams}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{translations.empty}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              <Image
                src={getPhotoUrl(photo.storage_path, 300)}
                alt={photo.cafe_name || 'Cafe photo'}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
            </div>
            <div className="p-3">
              <div className="mb-2">
                {photo.cafe_name ? (
                  <Link
                    href={`/cafes/${photo.cafe_slug}`}
                    className="font-medium hover:underline"
                  >
                    {photo.cafe_name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Unknown cafe</span>
                )}
              </div>
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(photo.created_at)}</span>
                <span>{formatFileSize(photo.file_size)}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  {translations.preview}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleApprove(photo.id)}
                  disabled={isPending && approvingId === photo.id}
                >
                  {isPending && approvingId === photo.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3 w-3" />
                  )}
                  {translations.approve}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => setRejectingPhoto(photo)}
                >
                  <X className="mr-1 h-3 w-3" />
                  {translations.reject}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      <PhotoPreviewModal
        photo={selectedPhoto}
        storageUrl={storageUrl}
        onClose={() => setSelectedPhoto(null)}
        onApprove={() => {
          if (selectedPhoto) {
            handleApprove(selectedPhoto.id);
            setSelectedPhoto(null);
          }
        }}
        onReject={() => {
          if (selectedPhoto) {
            setSelectedPhoto(null);
            setRejectingPhoto(selectedPhoto);
          }
        }}
        translations={translations}
      />

      {/* Reject Modal */}
      <RejectPhotoModal
        photo={rejectingPhoto}
        onClose={() => setRejectingPhoto(null)}
      />
    </>
  );
}
