
"use client";

import type { CommunityMessage } from '@/lib/data';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: CommunityMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const currentUser = auth.currentUser;
  const isSender = currentUser?.uid === message.userId;

  // Handle potential null or undefined timestamp
  const timestamp = message.createdAt?.toDate ? format(message.createdAt.toDate(), 'p') : '';

  return (
    <div className={cn("flex items-start gap-3", isSender && "flex-row-reverse")}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.userAvatar} />
        <AvatarFallback>{message.userName?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>
      <div className={cn("max-w-xs md:max-w-md rounded-lg px-4 py-2", isSender ? "bg-primary text-primary-foreground" : "bg-muted")}>
        <div className={cn("flex items-baseline gap-2", isSender && "flex-row-reverse")}>
          {!isSender && <p className="text-xs font-bold">{message.userName}</p>}
          <p className={cn("text-xs opacity-70", isSender ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {timestamp}
          </p>
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
}
