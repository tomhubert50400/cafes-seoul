'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { contactMessageSchema } from '@/lib/validations/contact';
import {
  createContactMessage,
  updateMessageReadStatus,
  deleteContactMessage,
} from '@/lib/supabase/contact-messages';

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
// SEND CONTACT MESSAGE (public)
// ============================================

export async function sendContactMessage(
  input: z.infer<typeof contactMessageSchema>
): Promise<{ success: boolean; error?: string }> {
  // 1. Validate input
  const validation = contactMessageSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map((i) => i.message).join(', ') };
  }

  // 2. Get user if authenticated (optional - guests can send too)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Create message
  const result = await createContactMessage(supabase, user?.id || null, validation.data);

  if (!result.success) {
    return { success: false, error: result.error || 'Failed to send message' };
  }

  return { success: true };
}

// ============================================
// TOGGLE MESSAGE READ STATUS (admin only)
// ============================================

const toggleReadSchema = z.object({
  messageId: z.string().uuid(),
  isRead: z.boolean(),
});

export async function toggleMessageRead(
  input: z.infer<typeof toggleReadSchema>
): Promise<{ success: boolean; error?: string }> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Validate input
  const validation = toggleReadSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.issues.map((i) => i.message).join(', ') };
  }

  // 4. Update read status
  const result = await updateMessageReadStatus(
    supabase,
    validation.data.messageId,
    validation.data.isRead,
    user.id
  );

  if (!result.success) {
    return { success: false, error: result.error || 'Failed to update message' };
  }

  // 5. Revalidate
  revalidatePath('/admin/messages');

  return { success: true };
}

// ============================================
// DELETE CONTACT MESSAGE (admin only)
// ============================================

const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
});

export async function deleteAdminContactMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Verify authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 2. Verify admin role
  if (!(await verifyAdminRole(supabase, user.id))) {
    return { success: false, error: 'Unauthorized - admin role required' };
  }

  // 3. Validate input
  const validation = deleteMessageSchema.safeParse({ messageId });
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  // 4. Delete message
  const result = await deleteContactMessage(supabase, validation.data.messageId);

  if (!result.success) {
    return { success: false, error: result.error || 'Failed to delete message' };
  }

  // 5. Revalidate
  revalidatePath('/admin/messages');

  return { success: true };
}
