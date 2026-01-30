import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { getMySubmission } from '@/lib/actions/submissions';
import { EditSubmissionClient } from '@/components/submissions/edit-submission-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SubmissionFormData } from '@/lib/validations/submission';

export const metadata: Metadata = {
  title: 'Edit Submission | Cafes Seoul',
  description: 'Edit your pending cafe submission',
};

interface EditSubmissionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSubmissionPage({ params }: EditSubmissionPageProps) {
  const { id } = await params;

  // Check authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/profile/submissions/' + id + '/edit');
  }

  // Fetch the submission with ownership check
  const result = await getMySubmission(id);

  if (!result.success || !result.submission) {
    notFound();
  }

  const submission = result.submission;

  // Only allow editing of pending submissions
  if (submission.status !== 'pending') {
    redirect('/profile/submissions');
  }

  // Transform submission data to form format
  const initialData: SubmissionFormData = {
    name: submission.name,
    address: submission.address,
    phone: submission.phone || undefined,
    latitude: submission.latitude || undefined,
    longitude: submission.longitude || undefined,
    districtId: submission.districtId || undefined,
    neighborhoodId: submission.neighborhoodId || undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header with back button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
            <Link href="/profile/submissions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Submissions
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Edit Submission</h1>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Clock className="mr-1 h-3 w-3" />
              Pending Review
            </Badge>
          </div>

          <p className="mt-2 text-muted-foreground">
            Make changes to your cafe submission before it&apos;s reviewed by our team.
          </p>
        </div>

        {/* Submission info card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Submission Details</CardTitle>
            <CardDescription>
              Submitted on {new Date(submission.createdAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">Status:</span>{' '}
                <span className="text-yellow-600">Pending Review</span>
              </span>
              {submission.phone && (
                <span>
                  <span className="font-medium text-foreground">Phone:</span> {submission.phone}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <EditSubmissionClient
          submission={submission}
          initialData={initialData}
        />

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Once approved, your submission will become a public cafe page.
            {' '}
            <Link href="/profile/submissions" className="text-primary hover:underline">
              Return to submissions
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
