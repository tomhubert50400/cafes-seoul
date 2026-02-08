'use client';

import { useTransition, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toggleMessageRead } from '@/lib/actions/contact';
import { toast } from 'sonner';
import { Loader2, Mail, MailOpen, User } from 'lucide-react';
import type { ContactMessageWithUser } from '@/types/contact';

interface MessageDetailModalProps {
  message: ContactMessageWithUser;
  isOpen: boolean;
  onClose: () => void;
  translations: Record<string, string>;
}

export function MessageDetailModal({
  message,
  isOpen,
  onClose,
  translations: t,
}: MessageDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const hasMarkedRead = useRef(false);

  // Auto-mark as read on open
  useEffect(() => {
    if (isOpen && !message.isRead && !hasMarkedRead.current) {
      hasMarkedRead.current = true;
      toggleMessageRead({ messageId: message.id, isRead: true });
    }
  }, [isOpen, message.isRead, message.id]);

  const handleToggleRead = () => {
    startTransition(async () => {
      const result = await toggleMessageRead({
        messageId: message.id,
        isRead: !message.isRead,
      });

      if (result.success) {
        toast.success(
          message.isRead
            ? t['admin.messages.markedUnread']
            : t['admin.messages.markedRead']
        );
        onClose();
      } else {
        toast.error(result.error || t['admin.messages.error']);
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{message.subject}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sender info */}
          <div className="flex items-start gap-3 rounded-md bg-muted p-3">
            <User className="mt-0.5 size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0 text-sm">
              <p className="font-medium">{message.senderName}</p>
              <p className="text-muted-foreground">{message.senderEmail}</p>
              <div className="mt-1 flex items-center gap-2">
                {message.user ? (
                  <Badge variant="secondary">
                    {message.user.displayName || message.user.username || t['admin.messages.registeredUser']}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t['admin.messages.guest']}</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDate(message.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Message body */}
          <div className="rounded-md border p-4">
            <p className="whitespace-pre-wrap text-sm">{message.message}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleToggleRead}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : message.isRead ? (
              <Mail className="mr-2 size-4" />
            ) : (
              <MailOpen className="mr-2 size-4" />
            )}
            {message.isRead
              ? t['admin.messages.markUnread']
              : t['admin.messages.markRead']}
          </Button>
          <Button onClick={onClose}>{t['common.close']}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
