'use client';

import { useRef } from 'react';

interface WritingSpacePanelProps {
  cardTitle: string;
  onClose: () => void;
}

export default function WritingSpacePanel({ cardTitle, onClose }: WritingSpacePanelProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const applyFormat = (command: string, value?: string) => {
    bodyRef.current?.focus();
    document.execCommand(command, false, value ?? undefined);
  };

  const applyFontSize = (px: string) => {
    bodyRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) {
      const span = document.createElement('span');
      span.style.fontSize = `${px}px`;
      range.surroundContents(span);
      sel.removeAllRanges();
    }
  };

  const applyColor = (color: string) => {
    bodyRef.current?.focus();
    document.execCommand('foreColor', false, color);
  };

  const handleLinkInsert = () => {
    const url = prompt('Enter URL:');
    if (url) {
      bodyRef.current?.focus();
      document.execCommand('createLink', false, url);
    }
  };

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
        <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">Writing Space</span>
      </div>

      {/* Title input */}
      <div className="px-4 pt-4 pb-2">
        <input
          ref={titleRef}
          type="text"
          placeholder="Give it a title…"
          className="w-full text-xl font-semibold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent"
        />
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-100" />

      {/* Body — contentEditable for rich text */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <div
          ref={bodyRef}
          contentEditable
          suppressContentEditableWarning
          className="w-full h-full min-h-[200px] text-sm text-gray-700 border-none outline-none bg-transparent leading-relaxed focus:outline-none"
          data-placeholder="Start writing…"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              document.execCommand('insertParagraph', false);
            }
          }}
        />
      </div>

      {/* Formatting toolbar */}
      <div className="border-t border-gray-100 px-3 py-2 flex items-center gap-1 flex-wrap">
        <button
          onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors font-bold text-sm"
          title="Bold"
        >
          B
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors italic text-sm"
          title="Italic"
        >
          I
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors underline text-sm"
          title="Underline"
        >
          U
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); applyFormat('strikeThrough'); }}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors line-through text-sm"
          title="Strikethrough"
        >
          S
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <select
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => applyFontSize(e.target.value)}
          defaultValue="16"
          className="text-xs text-gray-600 border border-gray-200 rounded px-1 py-0.5 outline-none hover:border-gray-300 bg-white"
          title="Font size"
        >
          {['12', '14', '16', '18', '20', '24', '28', '32'].map((s) => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <button
          onMouseDown={(e) => { e.preventDefault(); handleLinkInsert(); }}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        <button
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Bullet list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>

        <button
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertOrderedList'); }}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
          title="Numbered list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <label
          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          title="Text color"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <input
            type="color"
            className="sr-only"
            onChange={(e) => applyColor(e.target.value)}
          />
        </label>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #d1d5db;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
