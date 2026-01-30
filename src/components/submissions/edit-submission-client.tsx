'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CafeSubmissionForm } from '@/components/submissions/cafe-submission-form';
import { updateSubmission, checkDuplicateSubmissions } from '@/lib/actions/submissions';
import { SubmissionFormData } from '@/lib/validations/submission';
import type { CafeSubmission } from '@/types/submission';
import type { TranslatedText } from '@/types/cafe';

interface EditSubmissionClientProps {
  submission: CafeSubmission;
  initialData: SubmissionFormData;
}

export function EditSubmissionClient({ submission, initialData }: EditSubmissionClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: SubmissionFormData) => {
    setIsLoading(true);
    try {
      const result = await updateSubmission(submission.id, data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update submission');
      }

      toast.success('Submission updated successfully!');
      router.push('/profile/submissions');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update submission';
      toast.error(message);
      throw error; // Re-throw so form can handle the error state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckDuplicates = async (name: TranslatedText, address: TranslatedText) => {
    const result = await checkDuplicateSubmissions(name, address);
    return result.duplicates || [];
  };

  const handleSuccess = () => {
    // Handled by the toast and redirect in handleSubmit
  };

  return (
    <CafeSubmissionForm
      onSubmit={handleSubmit}
      onCheckDuplicates={handleCheckDuplicates}
      isLoading={isLoading}
      initialData={initialData}
      mode="edit"
      onSuccess={handleSuccess}
    />
  );
}
