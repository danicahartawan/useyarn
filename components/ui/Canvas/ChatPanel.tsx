'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Mic, ChevronLeft, Plus, ExternalLink, Globe, Search } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceResult[];
}

interface SourceResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  publishedDate?: string | null;
}

export interface NewCardData {
  title: string;
  subtitle: string;
  description: string;
  sourceUrl: string;
}

interface ChatPanelProps {
  onClose: () => void;
  projectTitle?: string;
  onAddCards?: (cards: NewCardData[]) => void;
}

const SUGGESTED = [
  'Summarize key findings',
  'Find related sources',
  'Draft an outline',
  'Identify gaps in research'
];

export default function ChatPanel({ onClose, projectTitle = 'Research Project', onAddCards }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<'exa' | 'browserbase'>('exa');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function autoResizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      let sources: SourceResult[] = [];

      if (provider === 'browserbase') {
        const res = await fetch(`/api/browserbase-search?q=${encodeURIComponent(content)}&n=8`);
        const data = await res.json();
        sources = (data.results ?? []).map((r: { id: string; url: string; title: string; domain: string }) => ({
          id: r.id,
          url: r.url,
          title: r.title,
          snippet: '',
          domain: r.domain,
          publishedDate: null
        }));
      } else {
        const res = await fetch(`/api/exa-search?q=${encodeURIComponent(content)}`);
        const data = await res.json();
        sources = data.results ?? [];
      }

      let assistantContent = '';
      if (sources.length === 0) {
        assistantContent = `I searched for "${content}" but couldn't find relevant sources. Try a more specific query.`;
      } else {
        const providerLabel = provider === 'browserbase' ? 'Browserbase' : 'Exa';
        assistantContent = `Found ${sources.length} source${sources.length !== 1 ? 's' : ''} via ${providerLabel} for "${content}". Nodes added — similarity connections are being computed…`;
        if (onAddCards) {
          onAddCards(
            sources.slice(0, 6).map((s) => ({
              title: s.title.length > 40 ? s.title.slice(0, 37) + '…' : s.title,
              subtitle: s.domain,
              description: s.snippet.length > 80 ? s.snippet.slice(0, 77) + '…' : s.snippet,
              sourceUrl: s.url
            }))
          );
        }
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        sources: sources.slice(0, 6)
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Search failed. Please check your Exa API key is configured.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      className="flex flex-col h-full bg-white border-r border-gray-200"
      style={{ width: '340px', minWidth: '280px' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
          aria-label="Close chat"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-gray-700 truncate flex-1">{projectTitle}</span>
        {/* Provider toggle */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setProvider('exa')}
            title="Search with Exa"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all ${
              provider === 'exa'
                ? 'bg-white text-gray-800 shadow-sm font-medium'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Search className="w-3 h-3" /> Exa
          </button>
          <button
            onClick={() => setProvider('browserbase')}
            title="Search with Browserbase"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all ${
              provider === 'browserbase'
                ? 'bg-white text-gray-800 shadow-sm font-medium'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Globe className="w-3 h-3" /> BB
          </button>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-start pt-4 gap-3">
            <p className="text-sm text-gray-500 leading-relaxed">
              Ask anything about your research. I'll search for real sources using Exa and add them directly to your canvas.
            </p>
            <div className="flex flex-col gap-2 w-full mt-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-lg px-3 py-2 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'user' ? (
                <div className="max-w-[85%] bg-gray-100 rounded-2xl rounded-tr-sm px-3 py-2">
                  <p className="text-sm text-gray-800 leading-relaxed">{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[95%] space-y-2">
                  <p className="text-sm text-gray-700 leading-relaxed">{msg.content}</p>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {msg.sources.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate group-hover:text-blue-700">{s.title}</p>
                            <p className="text-[10px] text-gray-400 truncate">{s.domain}</p>
                          </div>
                          <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <span className="text-[10px] text-gray-300 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="flex gap-1 pt-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 pt-0.5">Searching with Exa…</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-2 border-t border-gray-100">
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResizeTextarea(); }}
            onKeyDown={handleKeyDown}
            placeholder="Search and add to canvas…"
            rows={1}
            className="w-full text-sm px-3 pt-3 pb-1 outline-none resize-none placeholder-gray-300 text-gray-700 bg-transparent leading-snug"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <button className="p-1 text-gray-300 hover:text-gray-500 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-200 transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
