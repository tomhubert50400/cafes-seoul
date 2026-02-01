'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { PendingPhoto } from '@/lib/actions/admin';

interface PhotoPreviewModalProps {
  photo: PendingPhoto | null;
  storageUrl: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  translations: {
    preview: string;
    approve: string;
    reject: string;
  };
}

export function PhotoPreviewModal({
  photo,
  storageUrl,
  onClose,
  onApprove,
  onReject,
  translations,
}: PhotoPreviewModalProps) {
  if (!photo) return null;

  const getPhotoUrl = (storagePath: string) => {
    return `${storageUrl}/storage/v1/object/public/cafe-images/${storagePath}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={!!photo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{translations.preview}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Full-size image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={getPhotoUrl(photo.storage_path)}
              alt={photo.cafe_name || 'Cafe photo'}
              fill
              className="object-contain"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>

          {/* Photo info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {photo.cafe_name ? (
                <span>
                  Cafe:{' '}
                  <Link
                    href={`/cafes/${photo.cafe_slug}`}
                    className="font-medium text-foreground hover:underline"
                    target="_blank"
                  >
                    {photo.cafe_name}
                  </Link>
                </span>
              ) : (
                <span>Unknown cafe</span>
              )}
            </div>
            <div>Uploaded: {formatDate(photo.created_at)}</div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onApprove} className="w-full">
            <Check className="mr-2 h-4 w-4" />
            {translations.approve}
          </Button>
          <Button variant="destructive" onClick={onReject} className="w-full">
            <X className="mr-2 h-4 w-4" />
            {translations.reject}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
