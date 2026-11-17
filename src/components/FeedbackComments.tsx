'use client';

import { useState } from 'react';
import { ThumbsUp, Check, X, Trash2, Loader2, ExternalLink } from 'lucide-react';
import TripAdvisorSearch from '@/components/TripAdvisorSearch';
import { REACTIONS, Target, reactionLabel, needsPlace, SuggestedPlace, LIMITS } from '@/lib/feedback';

// Shared by "Help me plan" and the Sandbox's Feedback tab

export type Kind = 'hotel' | 'restaurant' | 'activity';
export interface FeedbackComment {
  id: string; targetType: Target; targetKey: string | null; targetLabel: string | null; reaction: string;
  text: string | null; suggestion: SuggestedPlace | null; status: 'open' | 'accepted' | 'dismissed';
  createdAt: string; author: string; byOwner: boolean; mine: boolean; agrees: number; agreedByMe: boolean;
}
type Comment = FeedbackComment;

export const KIND_LABEL: Record<Kind, string> = { hotel: 'Stay', restaurant: 'Eat', activity: 'Do' };
const CATEGORY: Record<Kind, 'hotels' | 'restaurants' | 'attractions'> = { hotel: 'hotels', restaurant: 'restaurants', activity: 'attractions' };

export function timeAgo(d: string) {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

/* ---------- Writing a comment ---------- */
export function Composer({
  tripId: id, target, targetKey, kind, city, country, onPosted, onCancel,
}: {
  tripId: string; target: Target; targetKey?: string; kind?: Kind; city?: string | null; country?: string | null;
  onPosted: () => void; onCancel?: () => void;
}) {
  const [reaction, setReaction] = useState('');
  const [text, setText] = useState('');
  const [suggestKind, setSuggestKind] = useState<Kind>(kind || 'restaurant');
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState<SuggestedPlace | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const wantsPlace = !!reaction && needsPlace(target, reaction);

  const post = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/feedback/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: target, targetKey, reaction, text, suggestion }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Couldn’t post that.');
      setReaction(''); setText(''); setSuggestion(null); setQuery('');
      onPosted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t post that.');
    } finally {
      setBusy(false);
    }
  };

  const canPost = !!reaction && !busy && (!wantsPlace || !!suggestion) && (reaction !== 'note' || !!text.trim());

  return (
    <div className="rounded-2xl bg-[#F8F7F4] border border-[#ECE7DF] p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {REACTIONS[target].map((r) => (
          <button
            key={r.key}
            type="button"
            aria-pressed={reaction === r.key}
            onClick={() => { setReaction(r.key); setSuggestion(null); }}
            className={`px-3 py-1.5 rounded-full border text-sm min-h-[36px] ${reaction === r.key ? 'bg-[#13212B] border-[#13212B] text-white font-semibold' : 'bg-white border-[#E2DCD2] text-[#2A3A44] hover:bg-[#F1EEE8]'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {wantsPlace && (
        <div className="mt-3 flex flex-col gap-2">
          {target !== 'place' && (
            <div className="flex gap-1.5" role="group" aria-label="Kind of place">
              {(['hotel', 'restaurant', 'activity'] as Kind[]).map((k) => (
                <button key={k} type="button" aria-pressed={suggestKind === k} onClick={() => { setSuggestKind(k); setSuggestion(null); setQuery(''); }}
                  className={`px-3 py-1 rounded-lg text-sm ${suggestKind === k ? 'bg-[#1F6F78] text-white font-semibold' : 'bg-white border border-[#E2DCD2] text-[#3D4C56]'}`}>
                  {k === 'hotel' ? 'Place to stay' : k === 'restaurant' ? 'Restaurant' : 'Thing to do'}
                </button>
              ))}
            </div>
          )}
          {suggestion ? (
            <div className="flex items-center gap-3 bg-white rounded-xl border border-[#E2DCD2] p-2">
              {suggestion.imageUrl && <img src={suggestion.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{suggestion.name}</p>
                {suggestion.location && <p className="text-xs text-[#5B6A73] line-clamp-1">{suggestion.location}</p>}
              </div>
              <button type="button" onClick={() => { setSuggestion(null); setQuery(''); }} className="text-sm text-[#1F6F78] underline px-2">Change</button>
            </div>
          ) : (
            <TripAdvisorSearch
              value={query}
              onChange={setQuery}
              onSelect={(r) => {
                const a = r.address_obj;
                setSuggestion({
                  kind: target === 'place' ? (kind || 'activity') : suggestKind,
                  name: r.name,
                  location: a ? [a.street1, a.city, a.country].filter(Boolean).join(', ') : null,
                  city: city || a?.city || null,
                  country: country || a?.country || null,
                  imageUrl: r.photo_url || r.photos?.[0]?.images?.medium?.url || null,
                  webUrl: r.web_url || null,
                });
              }}
              category={CATEGORY[target === 'place' ? (kind || 'activity') : suggestKind]}
              cityName={city || undefined}
              countryName={country || undefined}
              placeholder="Search for the place…"
              allowDescribe
            />
          )}
        </div>
      )}

      {reaction && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, LIMITS.textMax))}
          rows={2}
          placeholder={reaction === 'note' ? 'Your comment…' : 'Why? (optional)'}
          className="mt-3 w-full px-3 py-2 rounded-xl border border-[#E2DCD2] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6F78]"
        />
      )}
      {error && <p className="mt-2 text-sm text-[#B4532A]">{error}</p>}
      {(reaction || onCancel) && (
        <div className="mt-3 flex items-center gap-2">
          <button type="button" disabled={!canPost} onClick={post}
            className="inline-flex items-center px-4 min-h-[40px] rounded-xl bg-[#1F6F78] text-white text-sm font-semibold hover:bg-[#16535A] disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Post
          </button>
          {onCancel && <button type="button" onClick={onCancel} className="px-3 min-h-[40px] text-sm text-[#5B6A73]">Cancel</button>}
        </div>
      )}
    </div>
  );
}

/* ---------- One comment ---------- */
export function CommentCard({ c, isOwner, onChanged }: { c: Comment; isOwner: boolean; onChanged: (msg?: string) => void }) {
  const [busy, setBusy] = useState('');
  const act = async (action: string) => {
    if (action === 'delete' && !confirm('Delete this comment?')) return;
    setBusy(action);
    try {
      const r = await fetch(`/api/feedback/comments/${c.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { alert(d.error || 'Something went wrong.'); return; }
      const msg = d.changed === 'swapped' ? 'Swapped in your Sandbox trip.' : d.changed === 'added' ? 'Added to your Sandbox trip.' : d.changed === 'removed' ? 'Removed from your Sandbox trip.' : undefined;
      onChanged(msg);
    } finally {
      setBusy('');
    }
  };
  const s = c.suggestion;
  const changesPlan = (c.reaction === 'swap' || c.reaction === 'add_place') ? !!s : c.reaction === 'skip';

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 ${c.status === 'accepted' ? 'bg-[#F1F8F3] border-[#CFE5D6]' : c.status === 'dismissed' ? 'bg-[#F8F7F4] border-[#ECE7DF] opacity-70' : 'bg-white border-[#ECE7DF]'}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold text-[#13212B]">{c.author}</span>
        <span className="px-2 py-0.5 rounded-full bg-[#F1EEE8] text-[#2A3A44] text-xs font-semibold">{reactionLabel(c.targetType, c.reaction).replace('…', '')}</span>
        <span className="text-xs text-[#8A969D]">{timeAgo(c.createdAt)}</span>
        {c.status === 'accepted' && <span className="text-xs font-semibold text-[#2F7A4F]">✓ Accepted</span>}
        {c.status === 'dismissed' && <span className="text-xs text-[#5B6A73]">Set aside</span>}
      </div>
      {s && (
        <div className="mt-2 flex items-center gap-3 bg-[#FBFAF7] rounded-xl border border-[#ECE7DF] p-2">
          {s.imageUrl && <img src={s.imageUrl} alt="" loading="lazy" className="w-14 h-14 rounded-lg object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{s.name}</p>
            {s.location && <p className="text-xs text-[#5B6A73] line-clamp-1">{s.location}</p>}
          </div>
          {s.webUrl && (
            <a href={s.webUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-[#1F6F78]" aria-label={`Open ${s.name}`}><ExternalLink className="w-4 h-4" /></a>
          )}
        </div>
      )}
      {c.text && <p className="mt-2 text-sm text-[#2A3A44] whitespace-pre-line">{c.text}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {!c.mine && (
          <button type="button" onClick={() => act('agree')} disabled={!!busy} aria-pressed={c.agreedByMe}
            className={`inline-flex items-center px-3 min-h-[34px] rounded-full border text-xs font-semibold ${c.agreedByMe ? 'bg-[#E3F0F0] border-[#C3DEDF] text-[#16535A]' : 'bg-white border-[#E2DCD2] text-[#3D4C56]'}`}>
            <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Agree{c.agrees ? ` · ${c.agrees}` : ''}
          </button>
        )}
        {c.mine && c.agrees > 0 && <span className="text-xs text-[#5B6A73]"><ThumbsUp className="w-3.5 h-3.5 inline mr-1" />{c.agrees} agree</span>}
        {isOwner && c.status === 'open' && !c.byOwner && (
          <>
            <button type="button" onClick={() => act('accept')} disabled={!!busy}
              className="inline-flex items-center px-3 min-h-[34px] rounded-full bg-[#2F7A4F] text-white text-xs font-semibold hover:bg-[#256441]">
              {busy === 'accept' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1" />}
              {changesPlan ? (c.reaction === 'swap' ? 'Accept & swap' : c.reaction === 'skip' ? 'Accept & remove' : 'Accept & add') : 'Accept'}
            </button>
            <button type="button" onClick={() => act('dismiss')} disabled={!!busy}
              className="inline-flex items-center px-3 min-h-[34px] rounded-full bg-white border border-[#E2DCD2] text-[#3D4C56] text-xs font-semibold">
              <X className="w-3.5 h-3.5 mr-1" /> Set aside
            </button>
          </>
        )}
        {isOwner && c.status !== 'open' && (
          <button type="button" onClick={() => act('reopen')} disabled={!!busy} className="text-xs text-[#5B6A73] underline px-1">Undo</button>
        )}
        {(c.mine || isOwner) && (
          <button type="button" onClick={() => act('delete')} disabled={!!busy} className="ml-auto p-1.5 text-[#8A969D] hover:text-[#B4532A]" aria-label="Delete comment">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

