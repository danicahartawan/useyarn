'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Image,
  Settings,
  Lock,
  Package,
  File,
  Paintbrush,
  Wrench,
  Bookmark,
  Upload,
  Loader2,
  Search,
  BookOpen,
} from 'lucide-react';
import { useNotebook, FileNode } from './NotebookContext';

function getFileIconComponent(node: FileNode): React.ReactNode {
  const cls = 'w-3.5 h-3.5 flex-shrink-0';

  if (node.iconType) {
    switch (node.iconType) {
      case 'tsx':
      case 'ts':
        return <FileCode className={cls} />;
      case 'css':
        return <Paintbrush className={cls} />;
      case 'md':
        return <FileText className={cls} />;
      case 'image':
        return <Image className={cls} />;
      case 'settings':
        return <Settings className={cls} />;
      case 'lock':
        return <Lock className={cls} />;
      case 'package':
        return <Package className={cls} />;
      case 'bookmark':
        return <Bookmark className={cls} />;
    }
  }

  if (node.type === 'folder') return <Folder className={cls} />;

  const ext = node.name.split('.').pop() ?? '';
  const extMap: Record<string, React.ReactNode> = {
    ts: <FileCode className={cls} />,
    tsx: <FileCode className={cls} />,
    js: <FileCode className={cls} />,
    jsx: <FileCode className={cls} />,
    css: <Paintbrush className={cls} />,
    scss: <Paintbrush className={cls} />,
    json: <Package className={cls} />,
    md: <FileText className={cls} />,
    txt: <FileText className={cls} />,
    pdf: <FileText className={cls} />,
    docx: <FileText className={cls} />,
    svg: <Image className={cls} />,
    png: <Image className={cls} />,
    jpg: <Image className={cls} />,
    env: <Lock className={cls} />,
    gitignore: <Wrench className={cls} />,
  };
  return extMap[ext] ?? <File className={cls} />;
}

interface FileTreeNodeProps {
  node: FileNode;
  depth?: number;
  searchQuery?: string;
}

function nodeMatchesSearch(node: FileNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  if (node.children) {
    return node.children.some(child => nodeMatchesSearch(child, query));
  }
  return false;
}

function FileTreeNode({ node, depth = 0, searchQuery = '' }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth < 1 || !!searchQuery);
  const { selectedFileId, setSelectedFileId } = useNotebook();
  const iconComponent = getFileIconComponent(node);

  const shouldOpen = searchQuery ? true : isOpen;

  const handleDragStart = (e: React.DragEvent) => {
    if (node.type === 'folder') { e.preventDefault(); return; }
    e.dataTransfer.setData('application/x-notebook-file', JSON.stringify({ name: node.name, iconType: node.iconType ?? '' }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleFileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'file') {
      setSelectedFileId(node.id === selectedFileId ? null : node.id);
    }
  };

  if (searchQuery && !nodeMatchesSearch(node, searchQuery)) {
    return null;
  }

  if (node.type === 'folder') {
    const visibleChildren = searchQuery
      ? (node.children ?? []).filter(c => nodeMatchesSearch(c, searchQuery))
      : (node.children ?? []);

    return (
      <div>
        <button
          onClick={() => !searchQuery && setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded hover:bg-gray-50 transition-colors group"
          style={{ paddingLeft: `${8 + depth * 14}px` }}
        >
          <svg
            className={`w-2.5 h-2.5 text-gray-400 transition-transform flex-shrink-0 ${shouldOpen ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-400">
            {shouldOpen
              ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
              : <Folder className="w-3.5 h-3.5 flex-shrink-0" />
            }
          </span>
          <span className="text-[12px] text-gray-700 font-medium truncate">{node.name}</span>
        </button>
        {shouldOpen && visibleChildren.length > 0 && (
          <div>
            {visibleChildren.map(child => (
              <FileTreeNode key={child.id} node={child} depth={depth + 1} searchQuery={searchQuery} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedFileId === node.id;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleFileClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing group ${
        isSelected ? 'bg-blue-50 border border-blue-200' : ''
      }`}
      style={{ paddingLeft: `${8 + depth * 14 + 12}px` }}
      title={isSelected ? 'File selected as agent context' : 'Drag to canvas or click to select'}
    >
      <span className={`flex-shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>{iconComponent}</span>
      <span className={`text-[12px] truncate flex-1 ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{node.name}</span>
      {isSelected && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" title="Active context" />
      )}
      {!isSelected && (
        <svg
          className="w-2.5 h-2.5 text-gray-200 group-hover:text-gray-400 flex-shrink-0 transition-colors"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      )}
    </div>
  );
}

const ACCEPTED_EXTENSIONS = new Set(['pdf', 'txt', 'md', 'docx']);

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? '');
    reader.onerror = () => resolve('');
    reader.readAsText(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
    if (!res.ok) return '';
    const data = await res.json();
    return [data.title ?? '', data.description ?? ''].filter(Boolean).join('\n');
  } catch {
    return '';
  }
}

async function extractDocxText(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/parse-docx', { method: 'POST', body: formData });
    if (!res.ok) return '';
    const data = await res.json();
    return data.text ?? '';
  } catch {
    return '';
  }
}

function mergeCategoryTree(
  categorized: { name: string; category: string; content?: string }[],
  existingTree: FileNode[]
): FileNode[] {
  const tree = existingTree.map(node => ({ ...node, children: node.children ? [...node.children] : undefined }));

  for (const item of categorized) {
    const ext = item.name.split('.').pop() ?? '';
    const fileNode: FileNode = {
      id: `uploaded-${item.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: item.name,
      type: 'file',
      iconType: ext,
      content: item.content ?? '',
    };

    const existingFolder = tree.find(n => n.type === 'folder' && n.name === item.category);
    if (existingFolder) {
      existingFolder.children = [...(existingFolder.children ?? []), fileNode];
    } else {
      tree.unshift({
        id: `cat-${item.category}`,
        name: item.category,
        type: 'folder',
        children: [fileNode]
      });
    }
  }

  return tree;
}

type ActiveTab = 'library' | 'files';

export default function FileTree() {
  const { setFileTree, selectedFileId } = useNotebook();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localTree, setLocalTree] = useState<FileNode[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('files');
  const [searchQuery, setSearchQuery] = useState('');
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    setErrorMsg(null);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      return ACCEPTED_EXTENSIONS.has(ext);
    });

    if (droppedFiles.length === 0) {
      setErrorMsg('Only PDF, TXT, MD, and DOCX files are supported.');
      return;
    }

    setIsProcessing(true);
    try {
      const fileInputs = await Promise.all(
        droppedFiles.map(async (f) => {
          const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
          let content = '';
          if (ext === 'pdf') {
            content = await extractPdfText(f);
          } else if (ext === 'docx') {
            content = await extractDocxText(f);
          } else {
            content = await readFileAsText(f);
          }
          return { name: f.name, content };
        })
      );

      const res = await fetch('/api/categorize-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileInputs })
      });

      if (!res.ok) {
        throw new Error('Categorization failed');
      }

      const data = await res.json();
      const categorized: { name: string; category: string }[] = data.files;

      const categorizedWithContent = categorized.map((c) => ({
        ...c,
        content: fileInputs.find(f => f.name === c.name)?.content ?? '',
      }));

      setLocalTree((prev) => {
        const updated = mergeCategoryTree(categorizedWithContent, prev);
        setFileTree(updated);
        return updated;
      });
    } catch (err) {
      console.error('File categorization error:', err);
      setErrorMsg('Failed to categorize files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [setFileTree]);

  return (
    <div
      className="flex flex-col h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Tab bar: Library / File tree */}
      <div className="flex items-center border-b border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors ${
            activeTab === 'library'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          Library
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-b-2 transition-colors ${
            activeTab === 'files'
              ? 'border-gray-800 text-gray-800'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Folder className="w-3 h-3" />
          File tree
        </button>
      </div>

      {/* Search bar */}
      <div className="px-2 py-2 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'library' ? 'Search library…' : 'Search files…'}
            className="w-full text-[11px] bg-gray-50 border border-gray-100 rounded-md pl-6 pr-2 py-1.5 outline-none focus:border-gray-300 focus:bg-white transition-colors placeholder:text-gray-300"
          />
        </div>
      </div>

      {activeTab === 'library' ? (
        <div className="flex-1 overflow-y-auto py-2 px-3">
          <p className="text-[11px] text-gray-300 text-center pt-6 leading-relaxed">
            No library items yet.<br />Drop files in the File tree tab to add them.
          </p>
        </div>
      ) : (
        <>
          {selectedFileId && (
            <div className="mx-2 my-1.5 px-2.5 py-1.5 rounded-md bg-blue-50 border border-blue-100 flex-shrink-0">
              <p className="text-[10px] text-blue-600 font-medium">File selected as agent context</p>
              <p className="text-[10px] text-blue-400 mt-0.5">Search bar visible on canvas</p>
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`mx-2 my-2 rounded-lg border-2 border-dashed transition-all duration-150 flex items-center justify-center gap-2 py-2.5 px-2 flex-shrink-0 ${
              isDragOver
                ? 'border-blue-400 bg-blue-50 text-blue-500'
                : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span className="text-[11px] font-medium">Categorizing…</span>
              </>
            ) : isDragOver ? (
              <>
                <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] font-medium">Drop to categorize</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 flex-shrink-0" />
                <span className="text-[10px]">Drop PDF, TXT, MD, DOCX</span>
              </>
            )}
          </div>

          {errorMsg && (
            <p className="mx-2 mb-1 text-[10px] text-red-400 leading-snug">{errorMsg}</p>
          )}

          <div className="flex-1 overflow-y-auto py-1">
            {localTree.length === 0 && !isProcessing ? (
              <p className="px-3 py-4 text-[11px] text-gray-300 text-center leading-relaxed">
                Drop files above to<br />auto-categorize them here
              </p>
            ) : (
              localTree
                .filter(node => !searchQuery || nodeMatchesSearch(node, searchQuery))
                .map(node => (
                  <FileTreeNode key={node.id} node={node} searchQuery={searchQuery} />
                ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
