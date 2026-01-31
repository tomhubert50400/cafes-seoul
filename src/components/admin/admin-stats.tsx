import Link from 'next/link';
import { Coffee, Image, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface SubmissionCounts {
  pending: number;
  approved: number;
  declined: number;
}

export interface PhotoCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdminStatsProps {
  submissions: SubmissionCounts;
  photos: PhotoCounts;
  translations: {
    submissions: string;
    photos: string;
    pending: string;
    approved: string;
    declined: string;
    rejected: string;
  };
}

export function AdminStats({ submissions, photos, translations }: AdminStatsProps) {
  return (
    <div className="space-y-6">
      {/* Submissions Section */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Coffee className="h-5 w-5" />
          {translations.submissions}
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Pending - Clickable */}
          <Link href="/admin/submissions">
            <Card className="cursor-pointer transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {translations.pending}
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submissions.pending}</div>
              </CardContent>
            </Card>
          </Link>

          {/* Approved */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {translations.approved}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.approved}</div>
            </CardContent>
          </Card>

          {/* Declined */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {translations.declined}
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.declined}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photos Section */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Image className="h-5 w-5" />
          {translations.photos}
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Pending - Clickable */}
          <Link href="/admin/photos">
            <Card className="cursor-pointer transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {translations.pending}
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{photos.pending}</div>
              </CardContent>
            </Card>
          </Link>

          {/* Approved */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {translations.approved}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.approved}</div>
            </CardContent>
          </Card>

          {/* Rejected */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {translations.rejected}
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{photos.rejected}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
