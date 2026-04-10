'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Link2 } from 'lucide-react';
import EditorScrollbar from './EditorScrollbar';

interface RichTextEditorProps {
  initialTitle?: string;
  initialContent?: string;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
  appendContentRef?: React.MutableRefObject<((html: string) => void) | null>;
  pendingBlock?: { text: string; taskName: string } | null;
}

export default function RichTextEditor({
  initialTitle = '',
  initialContent = '',
  onTitleChange,
  onContentChange,
  appendContentRef,
  pendingBlock,
}: RichTextEditorProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [scrollInfo, setScrollInfo] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });

  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    setActiveFormats(formats);
  }, []);

  useEffect(() => {
    if (titleRef.current && initialTitle) {
      titleRef.current.textContent = initialTitle;
    }
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent;
    }
  }, []);

  useEffect(() => {
    if (!appendContentRef) return;
    appendContentRef.current = (html: string) => {
      if (!editorRef.current) return;
      editorRef.current.innerHTML = editorRef.current.innerHTML + html;
      onContentChange?.(editorRef.current.innerHTML);
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
  }, [appendContentRef, onContentChange]);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const update = () => {
      setScrollInfo({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (editorRef.current) ro.observe(editorRef.current);

    el.addEventListener('scroll', update, { passive: true });
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const handleTitleInput = () => {
    const text = titleRef.current?.textContent ?? '';
    onTitleChange?.(text);
  };

  const handleContentInput = () => {
    const html = editorRef.current?.innerHTML ?? '';
    onContentChange?.(html);
    updateActiveFormats();
    const el = scrollAreaRef.current;
    if (el) {
      setScrollInfo({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editorRef.current?.focus();
    }
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execFormat('createLink', url);
    }
  };

  const handleScrollTo = useCallback((scrollTop: number) => {
    scrollAreaRef.current?.scrollTo({ top: scrollTop, behavior: 'smooth' });
  }, []);

  const handleInsertSection = useCallback((targetScrollTop: number) => {
    const editor = editorRef.current;
    const scrollEl = scrollAreaRef.current;
    if (!editor || !scrollEl) return;

    const children = Array.from(editor.children) as HTMLElement[];
    if (children.length === 0) {
      const hr = document.createElement('hr');
      hr.className = 'notebook-section-divider';
      editor.appendChild(hr);
      onContentChange?.(editor.innerHTML);
      return;
    }

    const scrollElRect = scrollEl.getBoundingClientRect();
    let insertBefore: HTMLElement | null = null;

    for (const child of children) {
      const childRect = child.getBoundingClientRect();
      const childTopInScrollContainer = childRect.top - scrollElRect.top + scrollEl.scrollTop;
      if (childTopInScrollContainer > targetScrollTop) {
        insertBefore = child;
        break;
      }
    }

    const hr = document.createElement('hr');
    hr.className = 'notebook-section-divider';
    if (insertBefore) {
      editor.insertBefore(hr, insertBefore);
    } else {
      editor.appendChild(hr);
    }

    hr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    onContentChange?.(editor.innerHTML);

    setScrollInfo({
      scrollTop: scrollEl.scrollTop,
      scrollHeight: scrollEl.scrollHeight,
      clientHeight: scrollEl.clientHeight,
    });
  }, [onContentChange]);

  const toolbarButtons = [
    { id: 'bold', label: 'B', title: 'Bold', action: () => execFormat('bold'), style: 'font-bold' },
    { id: 'italic', label: 'I', title: 'Italic', action: () => execFormat('italic'), style: 'italic' },
    { id: 'underline', label: 'U', title: 'Underline', action: () => execFormat('underline'), style: 'underline' },
    { id: 'link', label: <Link2 className="w-3.5 h-3.5" />, title: 'Insert Link', action: handleLink, style: '' },
    { id: 'insertUnorderedList', label: '•', title: 'Bullet List', action: () => execFormat('insertUnorderedList'), style: '' },
    { id: 'insertOrderedList', label: '1.', title: 'Numbered List', action: () => execFormat('insertOrderedList'), style: '' },
    { id: 'h1', label: 'H1', title: 'Heading 1', action: () => execFormat('formatBlock', 'h1'), style: 'font-bold text-xs' },
    { id: 'h2', label: 'H2', title: 'Heading 2', action: () => execFormat('formatBlock', 'h2'), style: 'font-bold text-xs' },
    { id: 'p', label: 'P', title: 'Paragraph', action: () => execFormat('formatBlock', 'p'), style: '' },
  ];

  return (
    <div className="relative flex flex-col h-full bg-white">
      {/* Scrollable writing area — native scrollbar hidden, custom one overlaid */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-scroll px-12 pt-16 pb-24 notebook-scroll-area"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >

        {/* Title */}
        <div
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleInput}
          onKeyDown={handleTitleKeyDown}
          onFocus={() => setIsToolbarVisible(true)}
          data-placeholder="Give it a title..."
          className="text-3xl font-bold text-gray-900 outline-none mb-6 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 leading-tight"
          style={{ minHeight: '44px' }}
        />

        {/* Editor body */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentInput}
          onFocus={() => setIsToolbarVisible(true)}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          data-placeholder="Start writing..."
          className="flex-1 text-[15px] text-gray-700 outline-none leading-relaxed min-h-[300px] notebook-editor"
        />

        {/* Pending staged block — read-only, shown in-editor below content */}
        {pendingBlock && (
          <div
            style={{
              marginTop: '16px',
              background: '#f0fdf4',
              border: '2px solid #22c55e',
              borderRadius: '6px',
              overflow: 'hidden',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            aria-label="Pending proposal — read only"
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px',
              background: '#dcfce7',
              borderBottom: '1px solid #bbf7d0',
            }}>
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#16a34a', display: 'inline-block', flexShrink: 0,
              }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Staged paragraph — pending review
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#4ade80', fontWeight: 600 }}>+added</span>
            </div>
            <p style={{
              padding: '10px 12px',
              fontSize: '15px',
              color: '#166534',
              lineHeight: '1.6',
              margin: 0,
              borderLeft: '4px solid #22c55e',
              fontFamily: 'inherit',
            }}>
              {pendingBlock.text}
            </p>
            <div style={{
              padding: '3px 12px 4px',
              background: '#dcfce7',
              borderTop: '1px solid #bbf7d0',
              fontSize: '10px',
              color: '#6b7280',
            }}>
              Proposed by: <em>{pendingBlock.taskName}</em> · Use the review card to apply or dismiss
            </div>
          </div>
        )}
      </div>

      {/* Custom scrollbar */}
      <EditorScrollbar
        scrollTop={scrollInfo.scrollTop}
        scrollHeight={scrollInfo.scrollHeight}
        clientHeight={scrollInfo.clientHeight}
        onScrollTo={handleScrollTo}
        onInsertSection={handleInsertSection}
      />

      {/* Formatting toolbar pinned to bottom */}
      <div
        className={`absolute bottom-0 left-0 right-4 border-t border-gray-100 bg-white/95 backdrop-blur-sm px-8 py-2.5 flex items-center gap-0.5 transition-opacity duration-200 ${
          isToolbarVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onMouseDown={(e) => e.preventDefault()}
      >
        {toolbarButtons.map((btn, idx) => (
          <button
            key={btn.id}
            onClick={btn.action}
            title={btn.title}
            className={`px-2.5 py-1.5 rounded text-sm transition-colors hover:bg-gray-100 ${btn.style} ${
              activeFormats.has(btn.id)
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-800'
            } ${idx === 2 ? 'mr-2' : ''} ${idx === 5 ? 'mr-2' : ''}`}
          >
            {btn.label}
          </button>
        ))}

        <div className="flex-1" />

        <span className="text-[10px] text-gray-300 font-mono">
          {editorRef.current?.textContent?.split(/\s+/).filter(Boolean).length ?? 0} words
        </span>
      </div>

    </div>
  );
}
