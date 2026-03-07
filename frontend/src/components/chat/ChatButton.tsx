'use client';

import { MessageCircle } from 'lucide-react';

interface ChatButtonProps {
  unreadCount: number;
  onClick: () => void;
}

export function ChatButton({ unreadCount, onClick }: ChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
      title="Üzenetek"
      aria-label={`Üzenetek${unreadCount > 0 ? ` (${unreadCount} olvasatlan)` : ''}`}
    >
      <MessageCircle className="w-5 h-5" strokeWidth={2} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none ring-2 ring-[var(--surface)]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
