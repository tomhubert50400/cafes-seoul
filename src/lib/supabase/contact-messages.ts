import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContactMessage, ContactMessageWithUser, ContactMessageInput } from '@/types/contact';
import { resolveAvatarUrl } from '@/lib/supabase/transforms';

/**
 * Create a new contact message
 */
export async function createContactMessage(
  supabase: SupabaseClient,
  userId: string | null,
  data: ContactMessageInput
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('contact_messages')
    .insert({
      user_id: userId,
      sender_name: data.senderName,
      sender_email: data.senderEmail,
      subject: data.subject,
      message: data.message,
    });

  if (error) {
    console.error('Error creating contact message:', error);
    return { error: error.message, success: false };
  }

  return { success: true };
}

/**
 * Get all contact messages with optional user profile info
 * Admin only (enforced by RLS)
 */
export async function getContactMessages(
  supabase: SupabaseClient,
  params?: { unreadOnly?: boolean }
): Promise<ContactMessageWithUser[]> {
  // Fetch messages (no join — user_id FK points to auth.users, not profiles)
  let query = supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (params?.unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data: messages, error } = await query;

  if (error) {
    console.error('Error fetching contact messages:', error);
    return [];
  }

  if (!messages || messages.length === 0) return [];

  // Fetch profiles separately for registered users
  const userIds = [...new Set(messages.filter((m) => m.user_id).map((m) => m.user_id as string))];
  const profileMap = new Map<string, { username: string | null; display_name: string | null; avatar_url: string | null; created_at: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, created_at')
      .in('id', userIds);

    for (const p of profiles || []) {
      profileMap.set(p.id, p);
    }
  }

  return messages.map((m) => {
    const profile = m.user_id ? profileMap.get(m.user_id) : null;

    return {
      id: m.id,
      userId: m.user_id,
      senderName: m.sender_name,
      senderEmail: m.sender_email,
      subject: m.subject,
      message: m.message,
      isRead: m.is_read,
      readAt: m.read_at,
      readBy: m.read_by,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      user: profile
        ? {
            username: profile.username,
            displayName: profile.display_name,
            avatarUrl: resolveAvatarUrl(profile.avatar_url),
            totalReviews: 0,
            createdAt: profile.created_at,
          }
        : null,
    };
  });
}

/**
 * Update message read status
 * Admin only (enforced by RLS)
 */
export async function updateMessageReadStatus(
  supabase: SupabaseClient,
  messageId: string,
  isRead: boolean,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('contact_messages')
    .update({
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
      read_by: isRead ? adminUserId : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId);

  if (error) {
    console.error('Error updating message read status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a contact message
 * Admin only (enforced by RLS)
 */
export async function deleteContactMessage(
  supabase: SupabaseClient,
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting contact message:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
