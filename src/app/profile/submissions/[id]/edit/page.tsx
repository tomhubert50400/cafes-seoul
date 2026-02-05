import { redirect } from 'next/navigation';

// Edit functionality has been removed - submissions are now created via Kakao Maps autocomplete
// and cannot be manually edited. Redirect to submissions list.
export default function EditSubmissionPage() {
  redirect('/profile/submissions');
}
