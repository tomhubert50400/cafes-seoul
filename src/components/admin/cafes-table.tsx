'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DeleteCafeModal } from './delete-cafe-modal';
import type { AdminCafe } from '@/lib/actions/admin';
import { Trash2, ExternalLink, Star, MapPin, Calendar } from 'lucide-react';

interface CafesTableProps {
  cafes: AdminCafe[];
  translations: Record<string, string>;
}

export function CafesTable({ cafes, translations }: CafesTableProps) {
  const [deleteModalCafe, setDeleteModalCafe] = useState<AdminCafe | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Mobile: Card Layout */}
      <div className="divide-y md:hidden">
        {cafes.map((cafe) => (
          <div key={cafe.id} className="p-4 space-y-3">
            {/* Name & Link */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {cafe.name.en || cafe.name.ko}
                  </span>
                  <Link
                    href={`/cafes/${cafe.slug}`}
                    target="_blank"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
                {cafe.name.ko && cafe.name.en && (
                  <div className="text-sm text-muted-foreground truncate">
                    {cafe.name.ko}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteModalCafe(cafe)}
                className="shrink-0"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{cafe.address.en || cafe.address.ko}</span>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm">
              {/* Rating */}
              {cafe.overallRating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                  <span>{cafe.overallRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({cafe.totalRatings})
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground">No ratings</span>
              )}

              {/* Date */}
              <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                <Calendar className="size-3.5" />
                <span>{formatDate(cafe.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{translations['admin.table.name']}</TableHead>
            <TableHead className="hidden lg:table-cell">{translations['admin.table.address']}</TableHead>
            <TableHead className="text-center">{translations['admin.table.rating']}</TableHead>
            <TableHead className="text-center">{translations['admin.table.reviews']}</TableHead>
            <TableHead className="hidden lg:table-cell">{translations['admin.table.date']}</TableHead>
            <TableHead>{translations['admin.table.actions']}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cafes.map((cafe) => (
            <TableRow key={cafe.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="min-w-0">
                    <div className="truncate max-w-[200px]">{cafe.name.en || cafe.name.ko}</div>
                    {cafe.name.ko && cafe.name.en && (
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {cafe.name.ko}
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/cafes/${cafe.slug}`}
                    target="_blank"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="max-w-xs truncate">
                  {cafe.address.en || cafe.address.ko}
                </div>
              </TableCell>
              <TableCell className="text-center">
                {cafe.overallRating > 0 ? (
                  <div className="flex items-center justify-center gap-1">
                    <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{cafe.overallRating.toFixed(1)}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {cafe.totalRatings > 0 ? cafe.totalRatings : '-'}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {formatDate(cafe.createdAt)}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteModalCafe(cafe)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only lg:not-sr-only lg:ml-1">
                    {translations['admin.delete.button']}
                  </span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* Delete Modal */}
      {deleteModalCafe && (
        <DeleteCafeModal
          cafe={deleteModalCafe}
          isOpen={!!deleteModalCafe}
          onClose={() => setDeleteModalCafe(null)}
          translations={translations}
        />
      )}
    </div>
  );
}
