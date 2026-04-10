'use client';

import { useState, useRef } from 'react';
import {
  Home,
  SquarePen,
  Command,
  Puzzle,
  Shapes,
  ChevronDown,
  FileText,
  Link,
  AtSign,
  Settings,
  Plus,
  ArrowUp,
  AlignLeft,
  Hash
} from 'lucide-react';

interface CanvasSidebarProps {
  isOpen: boolean;
  onOpenChat?: () => void;
  onAddCard?: (data: { title: string; subtitle?: string; description?: string; icon?: string }) => void;
}

interface Source {
  id: string;
  type: 'pdf' | 'url';
  name: string;
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  authors: string;
  added: string;
  fullText: boolean;
  viewed: boolean;
  fileType: string;
  checked: boolean;
}

const navItems = [
  { icon: Home, label: 'Home' },
  { icon: SquarePen, label: 'New Chat' },
  { icon: Command, label: 'Flows' },
  { icon: Puzzle, label: 'Integrations' },
  { icon: Shapes, label: 'Patterns' }
];

const MOCK_RESULTS: Omit<SearchResult, 'checked'>[] = [
  {
    id: '1',
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al.',
    added: 'Jan 12',
    fullText: true,
    viewed: true,
    fileType: 'PDF'
  },
  {
    id: '2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: 'Devlin et al.',
    added: 'Feb 3',
    fullText: true,
    viewed: false,
    fileType: 'PDF'
  },
  {
    id: '3',
    title: 'Language Models are Few-Shot Learners',
    authors: 'Brown et al.',
    added: 'Mar 7',
    fullText: false,
    viewed: true,
    fileType: 'URL'
  },
  {
    id: '4',
    title: 'An Image is Worth 16x16 Words',
    authors: 'Dosovitskiy et al.',
    added: 'Mar 21',
    fullText: true,
    viewed: false,
    fileType: 'PDF'
  }
];

export default function CanvasSidebar({ isOpen, onOpenChat, onAddCard }: CanvasSidebarProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'todo'>('sources');
  const [activeNav, setActiveNav] = useState('Home');

  const [sources, setSources] = useState<Source[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function addSource(type: 'pdf' | 'url', name: string) {
    setSources(prev => [...prev, { id: Date.now().toString(), type, name }]);
  }

  async function processPdfs(files: File[]) {
    for (const f of files) {
      addSource('pdf', f.name);
      if (!onAddCard) continue;
      try {
        const form = new FormData();
        form.append('file', f);
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: form });
        const data = await res.json();
        if (!data.error) {
          onAddCard({ title: data.title, subtitle: data.subtitle, description: data.description, icon: 'file-text' });
        }
      } catch { /* silently skip */ }
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    processPdfs(files);
  }

  async function handleUrlSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !urlInput.trim()) return;
    const url = urlInput.trim();
    addSource('url', url);
    setUrlInput('');
    if (!onAddCard) return;
    try {
      const res = await fetch(`/api/fetch-link?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!data.error) {
        onAddCard({ title: data.title, subtitle: data.subtitle, description: data.description, icon: 'link' });
      }
    } catch { /* silently skip */ }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type === 'application/pdf');
    processPdfs(files);
    e.target.value = '';
  }

  function handleNewTask(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && newTaskText.trim()) {
      setTodos(prev => [...prev, { id: Date.now().toString(), text: newTaskText.trim(), done: false }]);
      setNewTaskText('');
      setIsAddingTask(false);
    } else if (e.key === 'Escape') {
      setNewTaskText('');
      setIsAddingTask(false);
    }
  }

  function toggleTodo(id: string) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function submitSearch() {
    if (!searchQuery.trim()) return;
    setSubmittedQuery(searchQuery.trim());
    setSearchResults(MOCK_RESULTS.map(r => ({ ...r, checked: false })));
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitSearch();
    }
  }

  function toggleResultCheck(id: string) {
    setSearchResults(prev => prev.map(r => r.id === id ? { ...r, checked: !r.checked } : r));
  }

  return (
    <div
      className={`absolute left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-10 transition-all duration-300 overflow-hidden flex flex-col ${
        isOpen ? 'w-48' : 'w-0'
      }`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* User profile header */}
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-[13px] font-normal text-gray-800 tracking-tight">danica</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col px-1.5 pb-2">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => {
              setActiveNav(label);
              if (label === 'New Chat' && onOpenChat) onOpenChat();
            }}
            className={`flex items-center gap-2 px-2 py-[5px] rounded-md text-[13px] transition-colors w-full text-left ${
              activeNav === label
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <Icon className="w-[15px] h-[15px] flex-shrink-0 stroke-[1.5]" />
            {label}
          </button>
        ))}
      </nav>

      {/* Sources / To Do tabs */}
      <div className="flex items-center gap-2 px-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => setActiveTab('sources')}
          className={`text-[12px] px-2.5 py-0.5 rounded-md transition-colors ${
            activeTab === 'sources'
              ? 'bg-white border border-gray-200 text-gray-800 font-medium shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Sources
        </button>
        <button
          onClick={() => setActiveTab('todo')}
          className={`text-[12px] px-1 py-0.5 transition-colors ${
            activeTab === 'todo'
              ? 'text-gray-800 font-medium'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          To Do
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'sources' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scrollable area: existing sources + results table */}
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-md px-2 py-3 text-center cursor-pointer transition-colors ${
                isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <p className="text-[11px] text-gray-400 leading-tight">Drop PDFs here</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* URL input */}
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={handleUrlSubmit}
              placeholder="Paste a URL..."
              className="w-full text-[12px] px-2 py-1 border border-gray-200 rounded-md outline-none focus:border-gray-400 placeholder-gray-300"
            />

            {/* Source list */}
            {sources.length === 0 ? (
              <p className="text-[11px] text-gray-300 pt-1">No sources yet.</p>
            ) : (
              <ul className="flex flex-col gap-1 mt-1">
                {sources.map(src => (
                  <li key={src.id} className="flex items-center gap-1.5 text-[12px] text-gray-700 truncate">
                    {src.type === 'pdf' ? (
                      <FileText className="w-3 h-3 flex-shrink-0 text-gray-400" />
                    ) : (
                      <Link className="w-3 h-3 flex-shrink-0 text-gray-400" />
                    )}
                    <span className="truncate">{src.name}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Search results table */}
            {submittedQuery && searchResults.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">Results</p>
                <div className="border border-gray-100 rounded-md overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: '480px' }}>
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="py-1.5 pl-2 pr-1 w-5" />
                        <th className="py-1.5 pr-1 w-4" />
                        <th className="py-1.5 pr-2 text-left text-[9px] font-semibold text-gray-400 uppercase tracking-wide" style={{ minWidth: '90px' }}>Title</th>
                        <th className="py-1.5 pr-2 text-left text-[9px] font-semibold text-gray-400 uppercase tracking-wide" style={{ minWidth: '70px' }}>Authors</th>
                        <th className="py-1.5 pr-2 text-left text-[9px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Added</th>
                        <th className="py-1.5 pr-2 text-center text-[9px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">Full text</th>
                        <th className="py-1.5 pr-2 text-center text-[9px] font-semibold text-gray-400 uppercase tracking-wide">Viewed</th>
                        <th className="py-1.5 pr-2 text-left text-[9px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">File type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map(row => (
                        <tr
                          key={row.id}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-2 pl-2 pr-1 align-middle">
                            <input
                              type="checkbox"
                              checked={row.checked}
                              onChange={() => toggleResultCheck(row.id)}
                              className="w-2.5 h-2.5 accent-gray-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 pr-1 align-middle">
                            <FileText className="w-2.5 h-2.5 text-gray-300" />
                          </td>
                          <td className="py-2 pr-2 align-middle">
                            <span className="text-[10px] text-gray-700 font-medium leading-tight line-clamp-2">{row.title}</span>
                          </td>
                          <td className="py-2 pr-2 align-middle">
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">{row.authors}</span>
                          </td>
                          <td className="py-2 pr-2 align-middle">
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">{row.added}</span>
                          </td>
                          <td className="py-2 pr-2 align-middle text-center">
                            <span className={`text-[10px] font-medium ${row.fullText ? 'text-green-600' : 'text-gray-300'}`}>
                              {row.fullText ? 'Yes' : '—'}
                            </span>
                          </td>
                          <td className="py-2 pr-2 align-middle text-center">
                            <span className={`text-[10px] font-medium ${row.viewed ? 'text-blue-500' : 'text-gray-300'}`}>
                              {row.viewed ? 'Yes' : '—'}
                            </span>
                          </td>
                          <td className="py-2 pr-2 align-middle">
                            <span className="text-[10px] text-gray-400">{row.fileType}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Search bar pinned to bottom */}
          <div className="px-2 pb-2 pt-1 border-t border-gray-100">
            <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
              {/* Text area */}
              <textarea
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Understand, research and write about anything"
                rows={2}
                className="w-full text-[11px] px-2.5 pt-2 pb-1 outline-none resize-none placeholder-gray-300 text-gray-700 bg-transparent leading-snug"
              />
              {/* Action chips row */}
              <div className="flex items-center gap-1 px-2 pb-2 pt-0.5 flex-wrap">
                {/* @ Mention chip */}
                <button className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-gray-200 text-[9px] text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <AtSign className="w-2.5 h-2.5" />
                  <span>Mention</span>
                </button>
                {/* Model selector chip */}
                <button className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-gray-200 text-[9px] text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Command className="w-2.5 h-2.5" />
                  <span>Model</span>
                </button>
                {/* Word count chip */}
                <button className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-gray-200 text-[9px] text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Hash className="w-2.5 h-2.5" />
                  <span>Words</span>
                </button>

                <div className="flex-1" />

                {/* Settings icon */}
                <button className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Settings className="w-2.5 h-2.5 text-gray-400" />
                </button>
                {/* Plus icon */}
                <button className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Plus className="w-2.5 h-2.5 text-gray-400" />
                </button>
                {/* Send / submit */}
                <button
                  onClick={submitSearch}
                  className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors flex-shrink-0"
                >
                  <ArrowUp className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-0.5 pt-1">
            {/* Existing tasks */}
            {todos.map(todo => (
              <div key={todo.id} className="flex items-center gap-2 py-1">
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 w-4 h-4 rounded-full border transition-colors ${
                    todo.done
                      ? 'border-gray-400 bg-gray-200'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                />
                <span
                  className={`text-[12px] leading-snug truncate ${
                    todo.done ? 'text-gray-300 line-through' : 'text-gray-700'
                  }`}
                >
                  {todo.text}
                </span>
              </div>
            ))}

            {/* New task row */}
            {isAddingTask ? (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-shrink-0 w-4 h-4 rounded-full border border-gray-300 bg-white" />
                <input
                  autoFocus
                  type="text"
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  onKeyDown={handleNewTask}
                  onBlur={() => { setIsAddingTask(false); setNewTaskText(''); }}
                  placeholder="New task..."
                  className="flex-1 text-[12px] outline-none placeholder-gray-300 text-gray-700 bg-transparent min-w-0"
                />
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTask(true)}
                className="flex items-center gap-2 py-1 w-full text-left"
              >
                <div className="flex-shrink-0 w-4 h-4 rounded-full border border-gray-200" />
                <span className="text-[12px] text-gray-300">New...</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
