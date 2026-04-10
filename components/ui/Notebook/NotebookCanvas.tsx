'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  FolderOpen, PenLine, FileCode, FileText, Image, Settings, Lock, Package,
  File, Paintbrush, Bookmark, Search, Send, Loader2, X, ExternalLink, Bot, StickyNote, NotebookPen
} from 'lucide-react';
import { useNotebook, FileNode } from './NotebookContext';
import AgentSearchOverlay from './AgentSearchOverlay';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function safeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch { /* ignore */ }
  return '#';
}

interface NoteCard {
  id: string;
  x: number;
  y: number;
  text: string;
  isEditing?: boolean;
  color?: string;
}

interface DroppedFile {
  id: string;
  x: number;
  y: number;
  name: string;
  icon: string;
}

interface GraphNode {
  id: string;
  fileId: string;
  name: string;
  iconType?: string;
  parentId?: string;
  x: number;
  y: number;
  isFolder: boolean;
}

interface SearchResult {
  url: string;
  title: string;
  snippet?: string;
}

interface QAMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
  isSearch?: boolean;
}

function getIconForType(iconType: string | undefined, isFolder: boolean): React.ReactNode {
  if (isFolder) return <FolderOpen className="w-4 h-4" />;
  if (!iconType) return <File className="w-4 h-4" />;
  switch (iconType) {
    case 'tsx': case 'ts': case 'js': case 'jsx':
      return <FileCode className="w-4 h-4" />;
    case 'css': case 'scss':
      return <Paintbrush className="w-4 h-4" />;
    case 'md': case 'txt': case 'pdf': case 'docx':
      return <FileText className="w-4 h-4" />;
    case 'image': case 'svg': case 'png': case 'jpg':
      return <Image className="w-4 h-4" />;
    case 'settings': case 'json':
      return <Settings className="w-4 h-4" />;
    case 'lock': case 'env':
      return <Lock className="w-4 h-4" />;
    case 'package':
      return <Package className="w-4 h-4" />;
    case 'bookmark':
      return <Bookmark className="w-4 h-4" />;
    default:
      return <File className="w-4 h-4" />;
  }
}

function getNodeColor(iconType: string | undefined, isFolder: boolean): string {
  if (isFolder) return '#f59e0b';
  if (!iconType) return '#6b7280';
  switch (iconType) {
    case 'tsx': case 'ts': case 'js': case 'jsx': return '#3b82f6';
    case 'css': case 'scss': return '#ec4899';
    case 'md': case 'txt': return '#8b5cf6';
    case 'pdf': case 'docx': return '#ef4444';
    case 'json': return '#f59e0b';
    case 'image': case 'svg': case 'png': case 'jpg': return '#10b981';
    case 'lock': case 'env': return '#6b7280';
    default: return '#64748b';
  }
}

function buildGraphNodes(fileTree: FileNode[]): GraphNode[] {
  const nodes: GraphNode[] = [];
  const COLS = 4;
  const H_SPACING = 160;
  const V_SPACING = 120;

  let fileIdx = 0;
  fileTree.forEach((folder, folderIdx) => {
    const folderX = 80 + folderIdx * H_SPACING;
    const folderY = 60;

    nodes.push({
      id: `gn-${folder.id}`,
      fileId: folder.id,
      name: folder.name,
      iconType: folder.iconType,
      x: folderX,
      y: folderY,
      isFolder: true,
    });

    if (folder.children) {
      folder.children.forEach((child) => {
        const col = fileIdx % COLS;
        const row = Math.floor(fileIdx / COLS);
        const childX = 60 + col * 140;
        const childY = 180 + row * V_SPACING;
        nodes.push({
          id: `gn-${child.id}`,
          fileId: child.id,
          name: child.name,
          iconType: child.iconType,
          parentId: `gn-${folder.id}`,
          x: childX,
          y: childY,
          isFolder: false,
        });
        fileIdx++;
      });
    }
  });

  return nodes;
}

interface NotebookCanvasProps {
  ghostNoteText?: string | null;
  addNoteRef?: React.MutableRefObject<((text: string) => void) | null>;
  appendNotesRef?: React.MutableRefObject<((html: string) => void) | null>;
}

export default function NotebookCanvas({ ghostNoteText, addNoteRef, appendNotesRef }: NotebookCanvasProps = {}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [files, setFiles] = useState<DroppedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [agentOverlayOpen, setAgentOverlayOpen] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { fileTree, selectedFileId, setSelectedFileId, getFileById } = useNotebook();
  const graphNodes = buildGraphNodes(fileTree);

  const [searchQuery, setSearchQuery] = useState('');
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedFile = selectedFileId ? getFileById(selectedFileId) : null;

  useEffect(() => {
    if (selectedFileId && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [selectedFileId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qaMessages]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setScale(prev => Math.min(Math.max(0.2, prev + delta), 4));
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('nb-canvas-bg')) {
      setIsPanning(true);
      setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains('nb-canvas-bg')) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    const id = `note-${Date.now()}`;
    setNotes(prev => [...prev, { id, x, y, text: '', isEditing: true }]);
  };

  const updateNote = (id: string, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));
  };

  const finishEditing = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isEditing: false } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const addNote = useCallback((text: string) => {
    const id = `note-${Date.now()}`;
    setNotes(prev => [...prev, { id, x: 60, y: 60, text, isEditing: false }]);
  }, []);

  useEffect(() => {
    if (addNoteRef) addNoteRef.current = addNote;
  }, [addNote, addNoteRef]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!canvasRef.current?.contains(e.relatedTarget as Node)) setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = e.dataTransfer.getData('application/x-notebook-file');
    if (!data) return;
    const { name, icon } = JSON.parse(data);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    const id = `file-${Date.now()}`;
    setFiles(prev => [...prev, { id, x, y, name, icon }]);
  };

  const handleNodeClick = (gn: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (gn.isFolder) return;
    const newId = gn.fileId === selectedFileId ? null : gn.fileId;
    setSelectedFileId(newId);
    if (newId === null) setQaMessages([]);
  };

  const handleNodeHoverEnter = (gnId: string) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredNodeId(gnId), 300);
  };

  const handleNodeHoverLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setHoveredNodeId(null), 150);
  };

  useEffect(() => {
    return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q || !selectedFile || isSearching) return;

    const userMsg: QAMessage = { role: 'user', content: q };
    setQaMessages(prev => [...prev, userMsg]);
    setSearchQuery('');
    setIsSearching(true);

    const isSlashSearch = q.startsWith('/search ') || q === '/search';
    const actualQuery = isSlashSearch ? q.replace(/^\/search\s*/, '').trim() : q;

    try {
      const res = await fetch('/api/perplexity-agent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: actualQuery || selectedFile.name,
          fileContext: selectedFile.content ?? selectedFile.name,
        }),
      });

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      const assistantMsg: QAMessage = {
        role: 'assistant',
        content: data.answer ?? 'No results found.',
        sources: data.sources ?? [],
        isSearch: true,
      };
      setQaMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errMsg: QAMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setQaMessages(prev => [...prev, errMsg]);
    } finally {
      setIsSearching(false);
    }
  };

  const hasGraph = graphNodes.length > 0;
  const hasCanvasContent = notes.length > 0 || files.length > 0;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">

      {/* File-scoped search panel — shown when a file node is selected */}
      {selectedFile && (
        <div className="flex-shrink-0 border-b border-blue-100 bg-blue-50/80 backdrop-blur-sm z-20">
          {/* File context header */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-blue-100 text-blue-600 flex-shrink-0">
              {getIconForType(selectedFile.iconType, false)}
            </div>
            <span className="text-[12px] font-medium text-blue-700 truncate flex-1">{selectedFile.name}</span>
            <button
              onClick={() => { setSelectedFileId(null); setQaMessages([]); }}
              className="text-blue-300 hover:text-blue-600 transition-colors flex-shrink-0"
              title="Deselect file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Q&A messages */}
          {qaMessages.length > 0 && (
            <div className="max-h-52 overflow-y-auto px-3 pb-1 space-y-2">
              {qaMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-700 shadow-sm'
                  }`}>
                    {msg.isSearch && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium mb-1.5">
                        <Search className="w-2.5 h-2.5" />
                        <span>Web search results</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Sources</p>
                        {msg.sources.map((src, si) => (
                          <a
                            key={si}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-1.5 text-[11px] text-blue-600 hover:text-blue-800 transition-colors group"
                          >
                            <ExternalLink className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                            <span className="truncate">{src.title || src.url}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'assistant' && (addNoteRef || appendNotesRef) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {addNoteRef && (
                        <button
                          onClick={() => {
                            const summary = msg.content.slice(0, 300) + (msg.content.length > 300 ? '…' : '');
                            const sourceLines = msg.sources && msg.sources.length > 0
                              ? '\n\nSources:\n' + msg.sources.slice(0, 3).map(s => `• ${s.title || s.url}`).join('\n')
                              : '';
                            addNoteRef.current?.(summary + sourceLines);
                          }}
                          className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <StickyNote className="w-2.5 h-2.5" />
                          Add to canvas
                        </button>
                      )}
                      {appendNotesRef && (
                        <button
                          onClick={() => {
                            const safeContent = escapeHtml(msg.content).replace(/\n/g, '<br/>');
                            const srcHtml = msg.sources && msg.sources.length > 0
                              ? `<ul style="margin:4px 0 0;padding-left:16px;">${msg.sources.map(s => `<li><a href="${escapeHtml(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title || s.url)}</a></li>`).join('')}</ul>`
                              : '';
                            appendNotesRef.current?.(`<p>${safeContent}</p>${srcHtml ? `<p><strong>Sources:</strong></p>${srcHtml}` : ''}`);
                          }}
                          className="flex items-center gap-1 text-[9px] text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <NotebookPen className="w-2.5 h-2.5" />
                          Add to notes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isSearching && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                    <span className="text-[11px] text-gray-400">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 px-3 py-2">
            <div className="flex-1 flex items-center gap-1.5 bg-white rounded-lg border border-blue-200 focus-within:border-blue-400 shadow-sm px-2.5 py-1.5 transition-colors">
              <Search className="w-3 h-3 text-gray-300 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Ask about ${selectedFile.name}… (web-sourced with citations)`}
                className="flex-1 text-[12px] text-gray-700 placeholder-gray-300 outline-none bg-transparent min-w-0"
                disabled={isSearching}
              />
              {searchQuery && (
                <span className="text-[9px] text-gray-300 font-mono flex-shrink-0 hidden sm:block">⌘I</span>
              )}
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white flex items-center justify-center transition-colors"
            >
              {isSearching
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Send className="w-3 h-3" />
              }
            </button>
          </form>

          <div className="px-3 pb-1.5">
            <p className="text-[9px] text-blue-300">
              All questions use the Perplexity agent with trusted web sources and citations
            </p>
          </div>
        </div>
      )}

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className={`flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none ${
          isPanning ? 'cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Grid background */}
        <div
          className="nb-canvas-bg absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${40 * scale}px ${40 * scale}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`
          }}
        />

        {/* Drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center"
            style={{ background: 'rgba(239,246,255,0.75)', border: '2px dashed #93c5fd' }}>
            <div className="flex items-center gap-2 bg-white rounded-xl px-5 py-3 shadow-lg border border-blue-100">
              <FolderOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-600">Drop file here to add a card</span>
            </div>
          </div>
        )}

        {/* Empty hint */}
        {!hasGraph && !hasCanvasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="mb-2"><PenLine className="w-7 h-7 text-gray-300 mx-auto" /></div>
              <p className="text-sm text-gray-400">Double-click to create a card</p>
              <p className="text-xs text-gray-300 mt-1">Drop files in the File Tree to see them as a node graph</p>
            </div>
          </div>
        )}

        {/* Ghost node — proposed canvas change preview */}
        {ghostNoteText && (
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 60,
              width: 200,
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: 'rgba(238,242,255,0.92)',
                border: '2px dashed #818cf8',
                borderRadius: '8px',
                boxShadow: '0 2px 12px rgba(99,102,241,0.15)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px 4px',
              }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Proposed node
                </span>
                <span style={{ fontSize: '9px', color: '#a5b4fc' }}>ghost</span>
              </div>
              <p style={{
                padding: '0 10px 10px',
                fontSize: '12px',
                color: '#4338ca',
                margin: 0,
                lineHeight: '1.45',
                opacity: 0.9,
              }}>
                {ghostNoteText}
              </p>
            </div>
          </div>
        )}

        {/* Canvas content */}
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
          className="absolute top-0 left-0"
        >
          {/* File node graph edges */}
          {hasGraph && (
            <svg
              className="absolute pointer-events-none"
              style={{ left: 0, top: 0, width: '3000px', height: '3000px', overflow: 'visible' }}
            >
              {graphNodes.map(gn => {
                if (!gn.parentId) return null;
                const parent = graphNodes.find(p => p.id === gn.parentId);
                if (!parent) return null;
                return (
                  <line
                    key={`edge-${gn.id}`}
                    x1={parent.x}
                    y1={parent.y}
                    x2={gn.x}
                    y2={gn.y}
                    stroke="#e5e7eb"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                );
              })}
            </svg>
          )}

          {/* File node graph nodes */}
          {graphNodes.map(gn => {
            const isSelected = !gn.isFolder && gn.fileId === selectedFileId;
            const isHovered = hoveredNodeId === gn.id;
            const color = getNodeColor(gn.iconType, gn.isFolder);

            return (
              <div
                key={gn.id}
                style={{
                  position: 'absolute',
                  left: gn.x,
                  top: gn.y,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isSelected ? 10 : (isHovered ? 8 : 2),
                }}
                onMouseEnter={() => handleNodeHoverEnter(gn.id)}
                onMouseLeave={handleNodeHoverLeave}
                onClick={(e) => handleNodeClick(gn, e)}
              >
                {/* Node circle */}
                <div
                  className="relative flex items-center justify-center rounded-full shadow-md transition-all duration-200"
                  style={{
                    width: gn.isFolder ? 44 : 36,
                    height: gn.isFolder ? 44 : 36,
                    background: isSelected ? color : `${color}20`,
                    border: `2px solid ${color}`,
                    boxShadow: isSelected
                      ? `0 0 0 4px ${color}30, 0 4px 12px ${color}40`
                      : isHovered ? `0 0 0 3px ${color}20` : undefined,
                    cursor: gn.isFolder ? 'default' : 'pointer',
                    color: isSelected ? 'white' : color,
                  }}
                >
                  {getIconForType(gn.iconType, gn.isFolder)}

                  {isSelected && (
                    <div
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center"
                    >
                      <div className="w-1 h-1 rounded-full bg-white" />
                    </div>
                  )}
                </div>

                {/* Node label */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-center pointer-events-none"
                  style={{ top: '100%', marginTop: '6px' }}
                >
                  <span
                    className="text-[10px] font-medium px-1 rounded"
                    style={{
                      color: isSelected ? color : '#374151',
                      background: isSelected ? `${color}15` : 'transparent',
                    }}
                  >
                    {gn.name.length > 18 ? gn.name.slice(0, 16) + '…' : gn.name}
                  </span>
                </div>

                {/* Hover preview */}
                {isHovered && (
                  <div
                    className="absolute z-30 rounded-xl shadow-xl border bg-white overflow-hidden"
                    style={{
                      left: '110%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 200,
                      animation: 'fadeInSlide 0.18s ease-out',
                    }}
                    onMouseEnter={() => {
                      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
                      setHoveredNodeId(gn.id);
                    }}
                    onMouseLeave={handleNodeHoverLeave}
                  >
                    <style>{`
                      @keyframes fadeInSlide {
                        from { opacity: 0; transform: translateY(-50%) translateX(-6px); }
                        to { opacity: 1; transform: translateY(-50%) translateX(0); }
                      }
                    `}</style>
                    <div
                      className="px-3 py-2 border-b border-gray-100 flex items-center gap-2"
                      style={{ background: `${color}12` }}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}20`, color }}
                      >
                        {getIconForType(gn.iconType, gn.isFolder)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-gray-800 truncate">{gn.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {gn.isFolder ? 'Folder' : (gn.iconType?.toUpperCase() ?? 'File')}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-2">
                      {(() => {
                        const fileData = getFileById(gn.fileId);
                        const snippet = fileData?.content?.slice(0, 120)?.trim();
                        return snippet
                          ? <p className="text-[10px] text-gray-500 leading-relaxed">{snippet}{fileData!.content!.length > 120 ? '…' : ''}</p>
                          : <p className="text-[10px] text-gray-300 italic">{gn.isFolder ? 'Contains files' : 'No preview available'}</p>;
                      })()}
                      {!gn.isFolder && (
                        <p className="text-[9px] text-blue-400 mt-1.5 font-medium">Click to select as agent context</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Note cards */}
          {notes.map(note => (
            <NoteCardItem
              key={note.id}
              note={note}
              scale={scale}
              offset={offset}
              onUpdate={updateNote}
              onFinish={finishEditing}
              onDelete={deleteNote}
              onMove={(id, nx, ny) => setNotes(prev => prev.map(n => n.id === id ? { ...n, x: nx, y: ny } : n))}
            />
          ))}

          {/* File cards (from drag-drop) */}
          {files.map(file => (
            <FileCardItem
              key={file.id}
              file={file}
              scale={scale}
              offset={offset}
              onDelete={deleteFile}
              onMove={(id, nx, ny) => setFiles(prev => prev.map(f => f.id === id ? { ...f, x: nx, y: ny } : f))}
            />
          ))}
        </div>

        {/* Agent button — bottom-left (general search, not file-scoped) */}
        <div className="absolute bottom-4 left-4" style={{ zIndex: 10 }}>
          <button
            onClick={() => setAgentOverlayOpen(true)}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-700 active:bg-gray-800 transition-colors text-xs font-medium"
          >
            <Bot className="w-3.5 h-3.5" />
            Agent
          </button>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-white rounded-lg shadow border border-gray-200 p-1.5" style={{ zIndex: 10 }}>
          <button onClick={() => setScale(s => Math.min(s + 0.1, 4))} className="px-2.5 py-1.5 hover:bg-gray-100 rounded font-mono text-sm transition-colors">+</button>
          <div className="px-2 py-0.5 text-center text-[10px] text-gray-500 font-mono">{Math.round(scale * 100)}%</div>
          <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="px-2.5 py-1.5 hover:bg-gray-100 rounded font-mono text-sm transition-colors">−</button>
          <div className="border-t border-gray-100 my-0.5" />
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="px-2.5 py-1.5 hover:bg-gray-100 rounded text-[10px] transition-colors">↺</button>
        </div>

        {/* Graph legend */}
        {hasGraph && (
          <div className="absolute bottom-16 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow border border-gray-200 px-3 py-2" style={{ zIndex: 10 }}>
            <p className="text-[9px] uppercase tracking-wide text-gray-400 font-medium mb-1">File Graph</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-[9px] text-gray-500">Folder</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-[9px] text-gray-500">File node</span>
            </div>
            <p className="text-[9px] text-gray-300 mt-1">Click to select context</p>
          </div>
        )}
      </div>

      {/* Agent search overlay (general, not file-scoped) */}
      {agentOverlayOpen && (
        <AgentSearchOverlay
          onClose={() => setAgentOverlayOpen(false)}
          onAddToCanvas={addNoteRef ? (ans, srcs) => {
            const summary = ans.slice(0, 300) + (ans.length > 300 ? '…' : '');
            const sourceLines = srcs.length > 0
              ? '\n\nSources:\n' + srcs.slice(0, 3).map(s => `• ${s.title || s.url}`).join('\n')
              : '';
            addNoteRef.current?.(summary + sourceLines);
          } : undefined}
          onAddToNotes={appendNotesRef ? (ans, srcs) => {
            const safeAns = escapeHtml(ans).replace(/\n/g, '<br/>');
            const srcHtml = srcs.length > 0
              ? `<ul style="margin:6px 0 0;padding-left:18px;">${srcs.map(s => `<li><a href="${escapeHtml(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title || s.url)}</a></li>`).join('')}</ul>`
              : '';
            appendNotesRef.current?.(`<p>${safeAns}</p>${srcHtml ? `<p><strong>Sources:</strong></p>${srcHtml}` : ''}`);
          } : undefined}
        />
      )}
    </div>
  );
}

interface NoteCardItemProps {
  note: NoteCard;
  scale: number;
  offset: { x: number; y: number };
  onUpdate: (id: string, text: string) => void;
  onFinish: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

function NoteCardItem({ note, scale, offset, onUpdate, onFinish, onDelete, onMove }: NoteCardItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });
  const hasDragged = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    e.stopPropagation();
    hasDragged.current = false;
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: note.x, cy: note.y };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.current.mx) / scale;
    const dy = (e.clientY - dragStart.current.my) / scale;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true;
    onMove(note.id, dragStart.current.cx + dx, dragStart.current.cy + dy);
  }, [isDragging, scale, note.id, onMove]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
      style={{ left: note.x, top: note.y, width: 200, zIndex: isDragging ? 100 : 1, cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
        <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wide">Note</span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(note.id)}
          className="text-gray-200 hover:text-red-400 transition-colors text-xs"
        >
          ×
        </button>
      </div>
      <textarea
        autoFocus={note.isEditing}
        value={note.text}
        onChange={(e) => onUpdate(note.id, e.target.value)}
        onBlur={() => { if (!note.text.trim()) onDelete(note.id); else onFinish(note.id); }}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Type your idea..."
        className="w-full px-2.5 pb-2.5 text-sm text-gray-700 resize-none outline-none placeholder-gray-300 bg-transparent leading-relaxed"
        rows={3}
        style={{ minHeight: 60 }}
      />
    </div>
  );
}

interface FileCardItemProps {
  file: DroppedFile;
  scale: number;
  offset: { x: number; y: number };
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

function FileCardItem({ file, scale, onDelete, onMove }: FileCardItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: file.x, cy: file.y };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = (e.clientX - dragStart.current.mx) / scale;
    const dy = (e.clientY - dragStart.current.my) / scale;
    onMove(file.id, dragStart.current.cx + dx, dragStart.current.cy + dy);
  }, [isDragging, scale, file.id, onMove]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
      style={{ left: file.x, top: file.y, width: 180, zIndex: isDragging ? 100 : 1, cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between px-2.5 pt-2 pb-0.5">
        <span className="text-[10px] text-gray-300 font-medium uppercase tracking-wide">File</span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(file.id)}
          className="text-gray-200 hover:text-red-400 transition-colors text-xs"
        >
          ×
        </button>
      </div>
      <div className="flex items-center gap-2 px-2.5 pb-2.5">
        <span className="text-xl">{file.icon}</span>
        <span className="text-xs text-gray-600 truncate font-medium">{file.name}</span>
      </div>
    </div>
  );
}
