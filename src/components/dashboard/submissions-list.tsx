'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Pencil, Trash2, Loader2 } from 'lucide-react';
import { StatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import { deleteSubmission } from '@/lib/actions/submissions';
import { toast } from 'sonner';
import { ROUTES } from '@/lib/constants/routes';

// ============================================
// TYPES
// ============================================

interface Submission {
  id: string;
  name: { en?: string; ko?: string };
  address: { en?: string; ko?: string };
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  rejection_reason?: string | null;
}

interface SubmissionsListProps {
  submissions: Submission[];
  totalCount: number;
  userId: string;
  translations: {
    empty: string;
    emptyCta: string;
    loadMore: string;
    remaining: string;
    showReason: string;
    hideReason: string;
    rejectionReason: string;
    edit: string;
    delete: string;
    deleteConfirm: string;
    statusPending: string;
    statusApproved: string;
    statusDeclined: string;
  };
}

// ============================================
// SUBMISSIONS LIST COMPONENT
// ============================================

export function SubmissionsList({
  submissions: initialSubmissions,
  totalCount,
  userId,
  translations,
}: SubmissionsListProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [expandedReasons, setExpandedReasons] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Status label mapping
  const statusLabels = {
    pending: translations.statusPending,
    approved: translations.statusApproved,
    declined: translations.statusDeclined,
    rejected: translations.statusDeclined,
  };

  // Load more submissions
  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/dashboard/submissions?offset=${submissions.length}&limit=5`
      );
      if (!response.ok) throw new Error('Failed to load more submissions');

      const newSubmissions = await response.json();
      setSubmissions((prev) => [...prev, ...newSubmissions]);
    } catch (error) {
      console.error('Error loading more submissions:', error);
      toast.error('Failed to load more submissions');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Toggle rejection reason expansion
  const toggleReason = (id: string) => {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Delete submission handler
  const handleDelete = async (id: string) => {
    if (!confirm(translations.deleteConfirm)) return;

    setDeletingId(id);
    startTransition(async () => {
      try {
        const result = await deleteSubmission(id);
        if (result.success) {
          setSubmissions((prev) => prev.filter((s) => s.id !== id));
          toast.success('Submission deleted');
        } else {
          toast.error(result.error || 'Failed to delete submission');
        }
      } catch (error) {
        console.error('Error deleting submission:', error);
        toast.error('Failed to delete submission');
      } finally {
        setDeletingId(null);
      }
    });
  };

  // Empty state
  if (submissions.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">{translations.empty}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={ROUTES.MAP}>{translations.emptyCta}</Link>
        </Button>
      </div>
    );
  }

  const hasMore = submissions.length < totalCount;
  const remainingCount = totalCount - submissions.length;

  return (
    <div className="mt-4 space-y-3">
      {submissions.map((submission) => {
        const cafeName = submission.name?.en || submission.name?.ko || 'Unnamed';
        const address = submission.address?.en || submission.address?.ko || '';
        const isExpanded = expandedReasons.has(submission.id);
        const isDeleting = deletingId === submission.id;

        return (
          <div
            key={submission.id}
            className="rounded-lg border p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium">{cafeName}</p>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                  {address}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge
                    status={submission.status}
                    label={statusLabels[submission.status]}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions for pending submissions */}
              {submission.status === 'pending' && (
                <div className="ml-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <Link href={`/profile/submissions/${submission.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">{translations.edit}</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(submission.id)}
                    disabled={isDeleting || isPending}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                    <span className="sr-only">{translations.delete}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Rejection reason for declined submissions */}
            {submission.status === 'declined' && submission.rejection_reason && (
              <div className="mt-3">
                <button
                  onClick={() => toggleReason(submission.id)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      {translations.hideReason}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      {translations.showReason}
                    </>
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                    <p className="font-medium">{translations.rejectionReason}:</p>
                    <p className="mt-1">{submission.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

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
