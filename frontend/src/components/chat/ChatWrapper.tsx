'use client';

import { useState } from 'react';
import { ChatButton } from './ChatButton';
import { ChatPanel } from './ChatPanel';

interface CompanyInfo {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage?: { content: string; createdAt: string };
}

interface ChatWrapperProps {
  currentUserId: string;
  role: 'ADMIN' | 'CLIENT';
  companyId: string | null;
  unreadCount: number;
  companies?: CompanyInfo[];
}

export function ChatWrapper({ currentUserId, role, companyId, unreadCount, companies }: ChatWrapperProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ChatButton unreadCount={unreadCount} onClick={() => setOpen(true)} />
      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        currentUserId={currentUserId}
        role={role}
        companyId={companyId}
        companies={companies}
      />
    </>
  );
}
