'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, usePaginatedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Check, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';
import { PageHeading } from '@/components/platform/page-heading';

export default function InboxPage() {
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
      <main
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
        aria-label="Loading inbox"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
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
    <main
      className="mx-auto min-h-screen max-w-[84rem] px-4 py-8 sm:px-6 md:py-12 lg:px-10"
      data-route-landmark="inbox"
    >
      <Link
        href="/activity"
        className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Activity
      </Link>
      <PageHeading
        title="Inbox"
        description={`${messages.length} message${messages.length !== 1 ? 's' : ''} loaded from your profile.`}
      />

      {messages.length === 0 ? (
        <Card className="gap-0 rounded-none border-x-0 bg-transparent p-0 shadow-none">
          <CardContent className="py-12 text-center">
            <p className="font-medium">No messages</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New profile messages will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(16rem,20rem)_1fr]">
          <div className="space-y-3">
            <div
              role="listbox"
              aria-label="Messages"
              className="divide-y divide-border border-y border-border"
            >
              {messages.map((message) => (
                <Card
                  key={message._id}
                  role="option"
                  tabIndex={0}
                  aria-selected={selectedMessageId === message._id}
                  className={`gap-0 cursor-pointer rounded-none border-0 p-0 shadow-none transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selectedMessageId === message._id
                      ? 'bg-secondary text-foreground'
                      : !message.isRead
                        ? 'bg-card'
                        : 'bg-card/70'
                  }`}
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
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {formatDistanceToNow(message.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {message.isReplied && (
                        <Badge variant="outline" className="text-xs">
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

          <div className="min-w-0">
            {selectedMessage ? (
              <Card className="gap-0 rounded-none border-x-0 bg-transparent p-0 shadow-none">
                <CardHeader className="px-0">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                    <div>
                      <CardTitle>{selectedMessage.subject}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        From: {selectedMessage.senderName} (
                        {selectedMessage.senderEmail})
                      </div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">
                        {formatDistanceToNow(selectedMessage.createdAt, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void handleMarkAsReplied(selectedMessage._id)
                        }
                        disabled={selectedMessage.isReplied}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {selectedMessage.isReplied ? 'Replied' : 'Mark Replied'}
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
                <CardContent className="mb-6 rounded border border-border bg-secondary p-5">
                  <p className="whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="gap-0 rounded-none border-x-0 bg-transparent p-0 shadow-none">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select a message</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
