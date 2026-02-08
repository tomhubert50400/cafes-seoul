'use client';

import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageDetailModal } from './message-detail-modal';
import { DeleteMessageModal } from './delete-message-modal';
import type { ContactMessageWithUser } from '@/types/contact';
import { Eye, Trash2 } from 'lucide-react';

interface MessagesTableProps {
  messages: ContactMessageWithUser[];
  translations: Record<string, string>;
}

export function MessagesTable({ messages, translations: t }: MessagesTableProps) {
  const [viewMessage, setViewMessage] = useState<ContactMessageWithUser | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<ContactMessageWithUser | null>(null);
  const [tab, setTab] = useState<'unread' | 'all'>('unread');

  const unreadMessages = messages.filter((m) => !m.isRead);
  const filteredMessages = tab === 'unread' ? unreadMessages : messages;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'unread' | 'all')}>
        <TabsList>
          <TabsTrigger value="unread">
            {t['admin.messages.unread']} ({unreadMessages.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            {t['admin.messages.all']} ({messages.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredMessages.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{t['admin.messages.empty']}</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="w-full overflow-hidden">
            {/* Mobile: Card Layout */}
            <div className="divide-y md:hidden">
              {filteredMessages.map((message) => (
                <div key={message.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={message.isRead ? 'text-sm' : 'text-sm font-semibold'}>
                        {message.senderName}
                      </p>
                      <p className="text-xs text-muted-foreground">{message.senderEmail}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!message.isRead && (
                        <Badge variant="default" className="text-xs">
                          {t['admin.messages.new']}
                        </Badge>
                      )}
                      {message.user ? (
                        <Badge variant="secondary" className="text-xs">
                          {t['admin.messages.registeredUser']}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <p className={message.isRead ? 'text-sm truncate' : 'text-sm font-medium truncate'}>
                    {message.subject}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px]"
                        onClick={() => setViewMessage(message)}
                      >
                        <Eye className="size-4" />
                        <span className="ml-1">{t['admin.messages.view']}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="min-h-[44px]"
                        onClick={() => setDeleteMessage(message)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
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
                    <TableHead>{t['admin.messages.sender']}</TableHead>
                    <TableHead>{t['admin.messages.subject']}</TableHead>
                    <TableHead>{t['admin.messages.date']}</TableHead>
                    <TableHead>{t['admin.messages.status']}</TableHead>
                    <TableHead>{t['admin.table.actions']}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div>
                          <p className={message.isRead ? 'text-sm' : 'text-sm font-semibold'}>
                            {message.senderName}
                          </p>
                          <p className="text-xs text-muted-foreground">{message.senderEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className={message.isRead ? 'max-w-xs truncate' : 'max-w-xs truncate font-semibold'}>
                          {message.subject}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(message.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!message.isRead && (
                            <Badge variant="default">{t['admin.messages.new']}</Badge>
                          )}
                          {message.isRead && (
                            <Badge variant="secondary">{t['admin.messages.read']}</Badge>
                          )}
                          {message.user ? (
                            <Badge variant="outline">{t['admin.messages.registeredUser']}</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewMessage(message)}
                          >
                            <Eye className="size-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-1">
                              {t['admin.messages.view']}
                            </span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteMessage(message)}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">{t['common.delete']}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewMessage && (
        <MessageDetailModal
          message={viewMessage}
          isOpen={!!viewMessage}
          onClose={() => setViewMessage(null)}
          translations={t}
        />
      )}

      {/* Delete Modal */}
      {deleteMessage && (
        <DeleteMessageModal
          message={deleteMessage}
          isOpen={!!deleteMessage}
          onClose={() => setDeleteMessage(null)}
          translations={t}
        />
      )}
    </>
  );
}
