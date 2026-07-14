'use client';

import { useState } from 'react';
import { useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Mail,
  MailOpen,
  Check,
  Trash2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';

export default function InboxPage() {
  const router = useRouter();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );

  const {
    results: messages,
    status,
    loadMore,
  } = usePaginatedQuery(api.messages.getMessages, {}, { initialNumItems: 50 });
  const markAsRead = useMutation(api.messages.markAsRead);
  const markAsReplied = useMutation(api.messages.markAsReplied);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  if (status === 'LoadingFirstPage') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedMessage = selectedMessageId
    ? messages.find((m) => m._id === selectedMessageId)
    : null;

  const handleMarkAsRead = async (messageId: Id<'contactMessages'>) => {
    try {
      await markAsRead({ messageId });
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAsReplied = async (messageId: Id<'contactMessages'>) => {
    try {
      await markAsReplied({ messageId });
      toast.success('Marked as replied');
    } catch {
      toast.error('Failed to mark as replied');
    }
  };

  const handleDelete = async (messageId: Id<'contactMessages'>) => {
    try {
      await deleteMessage({ messageId });
      setSelectedMessageId(null);
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const selectMessage = (messageId: Id<'contactMessages'>, isRead: boolean) => {
    setSelectedMessageId(messageId);
    if (!isRead) {
      void handleMarkAsRead(messageId);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/editor')}
            aria-label="Back to editor"
            title="Back to editor"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold font-serif">Inbox</h1>
            <p className="text-sm text-muted-foreground">
              {messages.length} loaded message
              {messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Messages from your public profile will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <div className="space-y-2">
              <div role="listbox" aria-label="Messages" className="space-y-2">
                {messages.map((message) => (
                  <Card
                    key={message._id}
                    role="option"
                    tabIndex={0}
                    aria-selected={selectedMessageId === message._id}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      selectedMessageId === message._id ? 'border-primary' : ''
                    } ${!message.isRead ? 'bg-muted/30' : ''}`}
                    onClick={() => selectMessage(message._id, message.isRead)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectMessage(message._id, message.isRead);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!message.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            <p className="font-medium truncate">
                              {message.senderName}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {message.subject}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(message.createdAt, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {message.isReplied && (
                          <Badge variant="secondary" className="text-xs">
                            Replied
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {status !== 'Exhausted' && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={status === 'LoadingMore'}
                  onClick={() => loadMore(50)}
                >
                  {status === 'LoadingMore' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Load older messages
                </Button>
              )}
            </div>

            <div>
              {selectedMessage ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedMessage.subject}</CardTitle>
                        <div className="text-sm text-muted-foreground mt-1">
                          From: {selectedMessage.senderName} (
                          {selectedMessage.senderEmail})
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(selectedMessage.createdAt, {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            void handleMarkAsReplied(selectedMessage._id)
                          }
                          disabled={selectedMessage.isReplied}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {selectedMessage.isReplied
                            ? 'Replied'
                            : 'Mark Replied'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleDelete(selectedMessage._id)}
                          aria-label="Delete message"
                          title="Delete message"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="py-6">
                    <p className="whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MailOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select a message to view
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
