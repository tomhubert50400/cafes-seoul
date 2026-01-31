'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { SubmissionWithUser } from '@/types/submission';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// HELPER: Verify admin role
// ============================================

async function verifyAdminRole(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return profile?.role === 'admin';
}

// ============================================
// HELPER: Generate slug from name
// ============================================

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\uAC00-\uD7A3]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  );
}

// ============================================
// APPROVE SUBMISSION
// ============================================

const approveSchema = z.object({
  submissionId: z.string().uuid(),
  adminNotes: z.string().optional(),
});

export async function approveSubmission(input: z.infer<typeof approveSchema>): Promise<{
  success: boolean;
  cafeId?: string;
  error?: string;
}> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role from database
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Validate input
  const validation = approveSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map((i) => i.message).join(', ') };
  }

  // 4. Fetch submission
  const { data: submission, error: fetchError } = await supabase
    .from('cafe_submissions')
    .select('*')
    .eq('id', validation.data.submissionId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !submission) {
    return { success: false, error: 'Submission not found or already processed' };
  }

  // 5. Create cafe from submission data
  const { data: cafe, error: cafeError } = await supabase
    .from('cafes')
    .insert({
      name: submission.name,
      address: submission.address,
      phone: submission.phone,
      latitude: submission.latitude,
      longitude: submission.longitude,
      district_id: submission.district_id,
      neighborhood_id: submission.neighborhood_id,
      slug: generateSlug(submission.name.en || submission.name.ko || 'cafe'),
      status: 'active',
    })
    .select('id')
    .single();

  if (cafeError) {
    console.error('Error creating cafe:', cafeError);
    return { success: false, error: 'Failed to create cafe' };
  }

  // 6. Update submission status
  const { error: updateError } = await supabase
    .from('cafe_submissions')
    .update({
      status: 'approved',
      admin_notes: validation.data.adminNotes || null,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      cafe_id: cafe.id,
    })
    .eq('id', validation.data.submissionId);

  if (updateError) {
    console.error('Error updating submission:', updateError);
    return { success: false, error: 'Failed to update submission status' };
  }

  // 7. Revalidate paths
  revalidatePath('/admin/submissions');
  revalidatePath('/admin');
  revalidatePath('/cafes');

  return { success: true, cafeId: cafe.id };
}

// ============================================
// REJECT SUBMISSION
// ============================================

const rejectSchema = z.object({
  submissionId: z.string().uuid(),
  rejectionReason: z.string().min(10, 'Reason must be at least 10 characters'),
  adminNotes: z.string().optional(),
});

export async function rejectSubmission(input: z.infer<typeof rejectSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role from database
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Validate input
  const validation = rejectSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map((i) => i.message).join(', ') };
  }

  // 4. Fetch submission to verify it exists and is pending
  const { data: submission, error: fetchError } = await supabase
    .from('cafe_submissions')
    .select('id')
    .eq('id', validation.data.submissionId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !submission) {
    return { success: false, error: 'Submission not found or already processed' };
  }

  // 5. Update submission status to declined
  const { error: updateError } = await supabase
    .from('cafe_submissions')
    .update({
      status: 'declined',
      rejection_reason: validation.data.rejectionReason,
      admin_notes: validation.data.adminNotes || null,
    })
    .eq('id', validation.data.submissionId);

  if (updateError) {
    console.error('Error rejecting submission:', updateError);
    return { success: false, error: 'Failed to reject submission' };
  }

  // 6. Revalidate paths
  revalidatePath('/admin/submissions');
  revalidatePath('/admin');

  return { success: true };
}

// ============================================
// EDIT SUBMISSION (before approving)
// ============================================

const editSchema = z.object({
  submissionId: z.string().uuid(),
  name: z.record(z.string()),
  address: z.record(z.string()),
  phone: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export async function editSubmission(input: z.infer<typeof editSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role from database
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Validate input
  const validation = editSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map((i) => i.message).join(', ') };
  }

  // 4. Fetch submission to verify it exists and is pending
  const { data: submission, error: fetchError } = await supabase
    .from('cafe_submissions')
    .select('id')
    .eq('id', validation.data.submissionId)
    .eq('status', 'pending')
    .single();

  if (fetchError || !submission) {
    return { success: false, error: 'Submission not found or already processed' };
  }

  // 5. Update submission content (not status)
  const updateData: Record<string, unknown> = {
    name: validation.data.name,
    address: validation.data.address,
    updated_at: new Date().toISOString(),
  };

  if (validation.data.phone !== undefined) {
    updateData.phone = validation.data.phone;
  }
  if (validation.data.latitude !== undefined) {
    updateData.latitude = validation.data.latitude;
  }
  if (validation.data.longitude !== undefined) {
    updateData.longitude = validation.data.longitude;
  }

  const { error: updateError } = await supabase
    .from('cafe_submissions')
    .update(updateData)
    .eq('id', validation.data.submissionId);

  if (updateError) {
    console.error('Error editing submission:', updateError);
    return { success: false, error: 'Failed to update submission' };
  }

  // 6. Revalidate paths
  revalidatePath('/admin/submissions');

  return { success: true };
}

// ============================================
// GET PENDING SUBMISSIONS (for admin table)
// ============================================

export async function getPendingSubmissions(options?: {
  offset?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  submissions?: SubmissionWithUser[];
  total?: number;
  error?: string;
}> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role from database
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Build query
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  // Get total count
  const { count } = await supabase
    .from('cafe_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Get submissions with user info
  const { data: submissions, error } = await supabase
    .from('cafe_submissions')
    .select(
      `
      *,
      user:profiles!user_id(id, email, display_name, avatar_url, role)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching pending submissions:', error);
    return { success: false, error: 'Failed to fetch submissions' };
  }

  // 4. Transform to SubmissionWithUser type
  const transformedSubmissions: SubmissionWithUser[] = (submissions || []).map((s) => ({
    id: s.id,
    userId: s.user_id,
    name: s.name,
    address: s.address,
    phone: s.phone,
    latitude: s.latitude,
    longitude: s.longitude,
    districtId: s.district_id,
    neighborhoodId: s.neighborhood_id,
    status: s.status,
    rejectionReason: s.rejection_reason,
    adminNotes: s.admin_notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    approvedAt: s.approved_at,
    approvedBy: s.approved_by,
    cafeId: s.cafe_id,
    user: {
      id: s.user?.id || '',
      email: s.user?.email || '',
      displayName: s.user?.display_name || null,
      avatarUrl: s.user?.avatar_url || null,
      role: s.user?.role,
    },
  }));

  return {
    success: true,
    submissions: transformedSubmissions,
    total: count || 0,
  };
}
