'use client';

import { useState, useCallback } from 'react';
import { SOURCE_CATEGORIES } from '@/lib/sourceCategories';

interface ExaResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedDate: string | null;
  domain: string;
}

interface ExaSearchResponse {
  results?: ExaResult[];
  error?: string;
}

interface SourcesPanelProps {
  cardTitle: string;
  onClose: () => void;
}

function DomainBadge({ domain, category }: { domain: string; category?: string }) {
  const colors: Record<string, string> = {
    'gov-politics': 'bg-green-50 text-green-700 border-green-200',
    journalism: 'bg-blue-50 text-blue-700 border-blue-200',
    legal: 'bg-purple-50 text-purple-700 border-purple-200',
    archive: 'bg-amber-50 text-amber-700 border-amber-200',
    reference: 'bg-gray-50 text-gray-600 border-gray-200'
  };
  const cls = category ? (colors[category] ?? colors.reference) : colors.reference;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${cls} font-medium`}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
        alt=""
        className="w-3 h-3 rounded-sm"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      {domain}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-400 rounded-full animate-spin" />
    </div>
  );
}

export default function SourcesPanel({ cardTitle, onClose }: SourcesPanelProps) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<ExaResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (submittedQuery) {
        runSearch(submittedQuery, next);
      }
      return next;
    });
  };

  const runSearch = useCallback(async (q: string, cats: Set<string>) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setError(null);
    setSubmittedQuery(q);

    const params = new URLSearchParams({ q });
    if (cats.size > 0) params.set('categories', Array.from(cats).join(','));

    try {
      const res = await fetch(`/api/exa-search?${params.toString()}`);
      const data = (await res.json()) as ExaSearchResponse;
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setResults(data.results ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') runSearch(query, activeCategories);
  };

  const getCategoryId = (domain: string) => {
    const cat = SOURCE_CATEGORIES.find((c) =>
      c.domains.some((d) => domain === d || domain.endsWith('.' + d))
    );
    return cat?.id;
  };

  const hasSearched = submittedQuery !== '';

  return (
    <div
      className="flex flex-col h-full bg-white border-l border-gray-200"
      style={{ width: '380px', minWidth: '320px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
            aria-label="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 truncate max-w-[220px]">{cardTitle}</span>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">Sources</span>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-2.5">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search sources…"
            className="flex-1 text-sm text-gray-700 bg-transparent border-none outline-none placeholder-gray-400"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setSubmittedQuery(''); setError(null); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => runSearch(query, activeCategories)}
            disabled={!query.trim() || isLoading}
            className="ml-1 text-xs bg-gray-800 hover:bg-gray-700 disabled:bg-gray-300 text-white rounded-md px-2 py-1 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Filter strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {SOURCE_CATEGORIES.map((cat) => {
            const active = activeCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  active
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <svg className="w-9 h-9 text-red-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-gray-400">Search error</p>
            <p className="text-xs text-gray-300 mt-1 max-w-[240px]">{error}</p>
          </div>
        ) : !hasSearched ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <p className="text-sm text-gray-400">Search trusted sources</p>
            <p className="text-xs text-gray-300 mt-1">CalMatters, ProPublica, PACER, Wayback Machine & more</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-400">No results found</p>
            <p className="text-xs text-gray-300 mt-1">Try a different query or clear category filters</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-gray-400">
              {results.length} result{results.length !== 1 ? 's' : ''} for <span className="font-medium text-gray-500">"{submittedQuery}"</span>
            </p>
            {results.map((result) => {
              const catId = getCategoryId(result.domain);
              return (
                <a
                  key={result.id}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border border-gray-100 rounded-lg p-3 hover:border-blue-200 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700 line-clamp-2 transition-colors mb-1">
                        {result.title}
                      </p>
                      <DomainBadge domain={result.domain} category={catId} />
                      {result.snippet && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{result.snippet}</p>
                      )}
                      {result.publishedDate && (
                        <p className="text-[10px] text-gray-300 mt-1">
                          {new Date(result.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              );
            })}
          </>
        )}

        {/* Add source hint */}
        <div className="pt-2 border-t border-gray-100">
          <button className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors py-2 px-1 rounded hover:bg-gray-50">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add a source manually
          </button>
        </div>
      </div>
    </div>
  );
}
