'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ChevronRight } from 'lucide-react';

interface Company { id: string; name: string; platforms: string[]; }
interface ChatMessage { role: 'admin' | 'client'; text: string; at: string; name?: string; reaction?: string; }

function fmtDate(at: string): string {
  if (!at) return '';
  const d = new Date(at);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
interface Evaluation {
  id: string; companyId: string; platform: string; month: string;
  adminMessage: string | null; adminMessageAt: string | null;
  clientReply: string | null; clientReplyAt: string | null;
  clientReadAt: string | null; clientReaction: string | null;
  messages?: ChatMessage[];
}

interface Props { companies: Company[]; evaluations: Evaluation[]; }

export function EvaluationsOverview({ companies, evaluations: initialEvals }: Props) {
  const [evaluations, setEvaluations] = useState(initialEvals);
  const [selectedCompany, setSelectedCompany] = useState(companies[0]?.id || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const company = companies.find(c => c.id === selectedCompany);

  // All messages for this company across all platforms/months, merged into one chat
  const companyEvals = evaluations.filter(e => e.companyId === selectedCompany);
  const allMessages: ChatMessage[] = companyEvals.flatMap(e => {
    const msgs = (e.messages as ChatMessage[] || []);
    if (msgs.length > 0) return msgs;
    // Legacy fallback
    const legacy: ChatMessage[] = [];
    if (e.adminMessage) legacy.push({ role: 'admin', text: e.adminMessage, at: e.adminMessageAt || '' });
    if (e.clientReply) legacy.push({ role: 'client', text: e.clientReply, at: e.clientReplyAt || '' });
    return legacy;
  });
  // Deduplicate by text+at (same message might be in multiple platform evals)
  const seen = new Set<string>();
  const uniqueMessages = allMessages.filter(m => {
    const key = `${m.role}:${m.text}:${m.at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  // Scroll to bottom on new messages
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [uniqueMessages.length]);

  // Clear message on company change
  const [lastCompany, setLastCompany] = useState(selectedCompany);
  if (selectedCompany !== lastCompany) { setLastCompany(selectedCompany); setMessage(''); setSaved(false); }

  async function handleSend() {
    if (!message.trim() || !company) return;
    setSaving(true);
    // Send to first platform only (the chat is unified, we just need one eval record)
    const platform = company.platforms[0] || 'TIKTOK_ORGANIC';
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    try {
      await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: selectedCompany, platform, month, adminMessage: message.trim() }),
      });
      const res = await fetch(`/api/evaluations?companyId=${selectedCompany}`);
      if (res.ok) {
        const fresh = await res.json();
        setEvaluations(prev => [...prev.filter(e => e.companyId !== selectedCompany), ...fresh]);
      }
      setMessage('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  // Companies with reply counts
  const companiesWithBadge = companies.map(c => {
    const evs = evaluations.filter(e => e.companyId === c.id);
    // Count evaluations where client replied after the last admin message
    const unread = evs.filter(e => e.clientReply && e.clientReplyAt && e.adminMessageAt && e.clientReplyAt > e.adminMessageAt).length;
    const totalMsgs = evs.flatMap(e => (e.messages as ChatMessage[] || [])).length;
    return { ...c, unread, totalMsgs };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Company list */}
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-4">
        <p className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Cégek</p>
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {companiesWithBadge.map(c => (
            <button key={c.id} onClick={() => setSelectedCompany(c.id)}
              className={`w-full text-left px-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition ${c.id === selectedCompany ? 'bg-[var(--accent-subtle)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)]'}`}>
              <span className="truncate">{c.name}</span>
              <div className="flex items-center gap-2">
                {c.totalMsgs > 0 && <span className="text-[10px] text-[var(--text-secondary)]">💬 {c.totalMsgs}</span>}
                {c.unread > 0 && <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{c.unread}</span>}
                <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Chat */}
      <div className="lg:col-span-2">
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl flex flex-col" style={{ height: '600px' }}>
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border)]">
            <MessageCircle className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-bold">{company?.name || 'Válassz céget'}</h2>
            {saved && <span className="text-green-500 text-xs font-bold ml-auto">Elküldve!</span>}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {uniqueMessages.length === 0 && (
              <div className="flex-1 flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">
                Kezdj el beszélgetést az ügyféllel
              </div>
            )}
            {uniqueMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'admin' ? 'justify-start' : 'justify-end'}`}>
                <div className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'admin'
                    ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-bl-md'
                    : 'bg-[var(--surface)] border border-[var(--border)] rounded-br-md'
                }`}>
                  <p className={`text-[10px] font-bold mb-0.5 ${msg.role === 'admin' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                    {msg.name || (msg.role === 'admin' ? 'Admin' : 'Ügyfél')}
                  </p>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {fmtDate(msg.at) && <p className="text-[10px] text-[var(--text-secondary)]">{fmtDate(msg.at)}</p>}
                    {msg.reaction && <span className="text-sm">{msg.reaction}</span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Compose */}
          <div className="px-5 py-3 border-t border-[var(--border)]">
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Üzenet írása..."
                rows={1}
                className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-[var(--accent)]"
              />
              <button onClick={handleSend} disabled={saving || !message.trim() || !company}
                className="btn-press px-4 py-2 rounded-xl bg-gradient-to-r from-[#1a6b8a] to-[#0d3b5e] text-white font-bold text-sm disabled:opacity-50 flex items-center gap-1">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
