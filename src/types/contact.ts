export interface ContactMessage {
  id: string;
  userId: string | null;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  readBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageWithUser extends ContactMessage {
  user: {
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    totalReviews: number;
    createdAt: string | null;
  } | null;
}

export interface ContactMessageInput {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}
