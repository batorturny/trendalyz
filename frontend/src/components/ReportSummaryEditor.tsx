'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Edit2, Save, X, Loader2, MessageSquareQuote } from 'lucide-react';

interface Props {
    companyId: string;
    month: string; // "YYYY-MM"
}

export function ReportSummaryEditor({ companyId, month }: Props) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tempContent, setTempContent] = useState('');

    useEffect(() => {
        fetch(`/api/summary/${companyId}/${month}`)
            .then(res => res.json())
            .then(data => {
                setContent(data.content || '');
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [companyId, month]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId, month, content: tempContent }),
            });
            if (res.ok) {
                const data = await res.json();
                setContent(data.content);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to save summary', error);
            alert('Sikertelen mentés');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    if (!content && !isAdmin) return null;

    return (
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-6 relative group">
            <div className="flex items-center gap-2 mb-3">
                <MessageSquareQuote className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="text-lg font-bold">Havi összefoglaló / Admin megjegyzés</h3>

                {isAdmin && !isEditing && (
                    <button
                        onClick={() => {
                            setTempContent(content);
                            setIsEditing(true);
                        }}
                        className="ml-auto p-2 hover:bg-[var(--surface)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        title="Szerkesztés"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <textarea
                        value={tempContent}
                        onChange={(e) => setTempContent(e.target.value)}
                        className="w-full min-h-[150px] p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none resize-y"
                        placeholder="Írd ide az összefoglalót..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface)] rounded-lg transition-colors flex items-center gap-2"
                            disabled={saving}
                        >
                            <X className="w-4 h-4" /> Mégse
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-bold text-white bg-[var(--accent)] hover:brightness-110 rounded-lg transition-all flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Mentés
                        </button>
                    </div>
                </div>
            ) : (
                <div className="prose dark:prose-invert max-w-none text-[var(--text-primary)] whitespace-pre-wrap">
                    {content || <em className="text-[var(--text-secondary)]">Nincs megjegyzés ehhez a hónaphoz.</em>}
                </div>
            )}
        </div>
    );
}
