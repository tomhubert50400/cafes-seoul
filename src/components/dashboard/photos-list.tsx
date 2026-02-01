'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Heart, Trash2, Loader2 } from 'lucide-react';
import { StatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import { deletePhoto } from '@/lib/actions/photos';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants/routes';
import Link from 'next/link';

// ============================================
// TYPES
// ============================================

interface Photo {
  id: string;
  storage_path: string;
  status: 'pending' | 'approved' | 'rejected';
  upvote_count: number;
  created_at: string;
  rejection_reason?: string | null;
  cafe: {
    name: { en?: string; ko?: string };
  } | null;
}

interface PhotosListProps {
  photos: Photo[];
  totalCount: number;
  userId: string;
  translations: {
    empty: string;
    emptyCta: string;
    loadMore: string;
    remaining: string;
    upvotes: string;
    delete: string;
    deleteConfirm: string;
    rejectionReason: string;
    statusPending: string;
    statusApproved: string;
    statusRejected: string;
  };
  storageUrl: string;
}

// ============================================
// PHOTOS LIST COMPONENT
// ============================================

export function PhotosList({
  photos: initialPhotos,
  totalCount,
  userId,
  translations,
  storageUrl,
}: PhotosListProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Status label mapping
  const statusLabels = {
    pending: translations.statusPending,
    approved: translations.statusApproved,
    rejected: translations.statusRejected,
  };

  // Build image URL with transform
  const getImageUrl = (storagePath: string) => {
    return `${storageUrl}/storage/v1/object/public/cafe-images/${storagePath}?width=200`;
  };

  // Load more photos
  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/dashboard/photos?offset=${photos.length}&limit=6`
      );
      if (!response.ok) throw new Error('Failed to load more photos');

      const newPhotos = await response.json();
      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (error) {
      console.error('Error loading more photos:', error);
      toast.error('Failed to load more photos');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Delete photo handler
  const handleDelete = async (id: string) => {
    if (!confirm(translations.deleteConfirm)) return;

    setDeletingId(id);
    startTransition(async () => {
      try {
        const result = await deletePhoto(id);
        if (result.success) {
          setPhotos((prev) => prev.filter((p) => p.id !== id));
          toast.success('Photo deleted');
        } else {
          toast.error(result.error || 'Failed to delete photo');
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
        toast.error('Failed to delete photo');
      } finally {
        setDeletingId(null);
      }
    });
  };

  // Empty state
  if (photos.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">{translations.empty}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={ROUTES.CAFES}>{translations.emptyCta}</Link>
        </Button>
      </div>
    );
  }

  const hasMore = photos.length < totalCount;
  const remainingCount = totalCount - photos.length;

  return (
    <div className="mt-4 space-y-4">
      {/* Photo grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => {
          // Handle cafe data - may be array or object
          const cafeData = photo.cafe as unknown;
          const cafe = Array.isArray(cafeData) ? cafeData[0] : cafeData;
          const typedCafe = cafe as { name: { en?: string; ko?: string } } | null;

          const cafeName = typedCafe?.name?.en || typedCafe?.name?.ko || 'Unknown Cafe';
          const isDeleting = deletingId === photo.id;

          return (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border bg-muted"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square">
                <Image
                  src={getImageUrl(photo.storage_path)}
                  alt={`Photo at ${cafeName}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />

                {/* Status badge overlay */}
                <div className="absolute left-2 top-2">
                  <StatusBadge
                    status={photo.status}
                    label={statusLabels[photo.status]}
                  />
                </div>

                {/* Upvote count */}
                {photo.upvote_count > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                    <Heart className="h-3 w-3 fill-current" />
                    <span>{photo.upvote_count}</span>
                  </div>
                )}

                {/* Delete button for pending photos */}
                {photo.status === 'pending' && (
                  <button
                    onClick={() => handleDelete(photo.id)}
                    disabled={isDeleting || isPending}
                    className="absolute right-2 top-2 rounded-full bg-destructive/80 p-1.5 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100 disabled:opacity-50"
                    title={translations.delete}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Cafe name below */}
              <div className="p-2">
                <p className="truncate text-xs text-muted-foreground">
                  {cafeName}
                </p>
                {/* Rejection reason on hover for rejected photos */}
                {photo.status === 'rejected' && photo.rejection_reason && (
                  <p
                    className="mt-1 truncate text-xs text-red-600 dark:text-red-400"
                    title={`${translations.rejectionReason}: ${photo.rejection_reason}`}
                  >
                    {translations.rejectionReason}: {photo.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                {translations.loadMore}{' '}
                <span className="ml-1 text-muted-foreground">
                  ({remainingCount} {translations.remaining})
                </span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
