'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ExternalLink, Loader2, StickyNote, NotebookPen } from 'lucide-react';

interface Source {
  url: string;
  title: string;
}

interface AgentSearchOverlayProps {
  onClose: () => void;
  onAddToCanvas?: (answer: string, sources: Source[]) => void;
  onAddToNotes?: (answer: string, sources: Source[]) => void;
}

export default function AgentSearchOverlay({ onClose, onAddToCanvas, onAddToNotes }: AgentSearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addedToCanvas, setAddedToCanvas] = useState(false);
  const [addedToNotes, setAddedToNotes] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setAnswer(null);
    setSources([]);
    setError(null);
    setAddedToCanvas(false);
    setAddedToNotes(false);

    try {
      const res = await fetch('/api/perplexity-agent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Search failed. Please try again.');
      } else {
        setAnswer(data.answer ?? '');
        setSources(data.sources ?? []);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleAddToCanvas = () => {
    if (!answer || !onAddToCanvas) return;
    onAddToCanvas(answer, sources);
    setAddedToCanvas(true);
  };

  const handleAddToNotes = () => {
    if (!answer || !onAddToNotes) return;
    onAddToNotes(answer, sources);
    setAddedToNotes(true);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onMouseDown={handleBackdropClick}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col"
        style={{ width: 640, maxWidth: '94vw', maxHeight: '80vh' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-900 flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-800 tracking-tight">Agent Search</span>
          <span className="ml-1 text-xs text-gray-400 font-normal">Trusted sources only</span>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-gray-400 focus-within:bg-white transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a research question…"
              className="flex-1 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg disabled:opacity-40 hover:bg-gray-700 active:bg-gray-800 transition-colors"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching…</span>
                </>
              ) : (
                <span>Search</span>
              )}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-gray-400 leading-snug">
            Sources: AP News, Reuters, ProPublica, CalMatters, MuckRock, Reveal News, DocumentCloud, Internet Archive, and more.
          </p>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
          {/* Searching animation */}
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-400">Searching trusted sources…</p>
            </div>
          )}

          {/* Error */}
          {error && !isSearching && (
            <div className="mt-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Answer */}
          {answer !== null && !isSearching && (
            <div className="mt-2">
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap rounded-xl bg-gray-50 border border-gray-100 px-4 py-4">
                {answer}
              </div>

              {sources.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Sources
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 transition-colors group"
                      >
                        <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                        <span className="truncate">{source.title || source.url}</span>
                        <span className="ml-auto text-gray-300 text-[10px] flex-shrink-0 truncate max-w-[140px]">
                          {(() => {
                            try { return new URL(source.url).hostname.replace('www.', ''); } catch { return ''; }
                          })()}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {(onAddToCanvas || onAddToNotes) && (
                <div className="mt-4 flex items-center gap-2">
                  {onAddToCanvas && (
                    <button
                      onClick={handleAddToCanvas}
                      disabled={addedToCanvas}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-default border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                      {addedToCanvas ? 'Added to canvas' : 'Add to canvas'}
                    </button>
                  )}
                  {onAddToNotes && (
                    <button
                      onClick={handleAddToNotes}
                      disabled={addedToNotes}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-default border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    >
                      <NotebookPen className="w-3.5 h-3.5" />
                      {addedToNotes ? 'Added to notes' : 'Add to notes'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
