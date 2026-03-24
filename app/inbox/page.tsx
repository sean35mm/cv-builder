'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
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

export default function InboxPage() {
  const router = useRouter();
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null
  );

  const messages = useQuery(api.messages.getMessages);
  const markAsRead = useMutation(api.messages.markAsRead);
  const markAsReplied = useMutation(api.messages.markAsReplied);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  if (messages === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedMessage = selectedMessageId
    ? messages.find((m) => m._id === selectedMessageId)
    : null;

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markAsRead({ messageId: messageId as any });
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAsReplied = async (messageId: string) => {
    try {
      await markAsReplied({ messageId: messageId as any });
      toast.success('Marked as replied');
    } catch (error) {
      toast.error('Failed to mark as replied');
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage({ messageId: messageId as any });
      setSelectedMessageId(null);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
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
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold font-serif">Inbox</h1>
            <p className="text-sm text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
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
              {messages.map((message) => (
                <Card
                  key={message._id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedMessageId === message._id ? 'border-primary' : ''
                  } ${!message.isRead ? 'bg-muted/30' : ''}`}
                  onClick={() => {
                    setSelectedMessageId(message._id);
                    if (!message.isRead) {
                      handleMarkAsRead(message._id);
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
                            handleMarkAsReplied(selectedMessage._id)
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
                          onClick={() => handleDelete(selectedMessage._id)}
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
