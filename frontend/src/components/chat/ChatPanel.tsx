'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowLeft, Send, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  companyId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string | null; email: string; role: string };
}

interface CompanyInfo {
  id: string;
  name: string;
  unreadCount: number;
  lastMessage?: { content: string; createdAt: string };
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  currentUserId: string;
  role: 'ADMIN' | 'CLIENT';
  companyId: string | null;
  companies?: CompanyInfo[];
}

export function ChatPanel({ open, onClose, currentUserId, role, companyId, companies }: ChatPanelProps) {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(companyId);
  const [activeCompanyName, setActiveCompanyName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      if (role === 'CLIENT' && companyId) {
        setActiveCompanyId(companyId);
      } else if (role === 'ADMIN') {
        setActiveCompanyId(null);
      }
    } else {
      setMessages([]);
      setInput('');
    }
  }, [open, role, companyId]);

  const fetchMessages = useCallback(async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${cId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (cId: string) => {
    await fetch(`/api/messages/${cId}/read`, { method: 'POST' });
  }, []);

  useEffect(() => {
    if (activeCompanyId && open) {
      fetchMessages(activeCompanyId);
      markRead(activeCompanyId);
    }
  }, [activeCompanyId, open, fetchMessages, markRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeCompanyId && open && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeCompanyId, open, loading]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (role === 'ADMIN' && activeCompanyId) {
          setActiveCompanyId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, role, activeCompanyId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeCompanyId || sending) return;

    setSending(true);
    setInput('');
    try {
      const res = await fetch(`/api/messages/${activeCompanyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openCompanyChat = (c: CompanyInfo) => {
    setActiveCompanyId(c.id);
    setActiveCompanyName(c.name);
  };

  if (!open) return null;

  const showCompanyList = role === 'ADMIN' && !activeCompanyId;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[var(--surface)] border-l border-[var(--border)] z-50 flex flex-col animate-slide-in-right shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-raised)]">
          {role === 'ADMIN' && activeCompanyId && (
            <button
              onClick={() => setActiveCompanyId(null)}
              className="p-1.5 rounded-lg hover:bg-[var(--accent-subtle)] transition"
              aria-label="Vissza"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">
              {showCompanyList ? 'Üzenetek' : (activeCompanyName || 'Chat')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--accent-subtle)] transition"
            aria-label="Bezárás"
          >
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {showCompanyList ? (
          <div className="flex-1 overflow-y-auto">
            {(!companies || companies.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                <MessageCircle className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">Nincsenek cégek</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openCompanyChat(c)}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--accent-subtle)] transition flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.name}</span>
                        {c.unreadCount > 0 && (
                          <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      {c.lastMessage && (
                        <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                          {c.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                  <MessageCircle className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">Még nincsenek üzenetek</p>
                  <p className="text-xs mt-1">Írj az első üzenetet!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                        isOwn
                          ? 'bg-[var(--accent)] text-white rounded-br-md'
                          : 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md'
                      }`}>
                        {!isOwn && (
                          <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                            {msg.sender.name || msg.sender.email}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isOwn ? 'text-white/60' : 'text-[var(--text-secondary)]'}`}>
                          {new Date(msg.createdAt).toLocaleString('hu-HU', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--surface-raised)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Írj üzenetet..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 max-h-32"
                  style={{ minHeight: '40px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="p-2.5 rounded-xl bg-[var(--accent)] text-white disabled:opacity-40 hover:brightness-110 transition shrink-0"
                  aria-label="Küldés"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
