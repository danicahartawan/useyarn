'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import NotebookTopBar from '@/components/ui/Notebook/NotebookTopBar';
import RichTextEditor from '@/components/ui/Notebook/RichTextEditor';
import NotebookCanvas from '@/components/ui/Notebook/NotebookCanvas';
import AgentCanvas from '@/components/ui/Notebook/AgentCanvas';
import MultitaskerSidebar from '@/components/ui/Notebook/MultitaskerSidebar';
import { ProposalProvider, useProposals } from '@/components/ui/Notebook/ProposalContext';
import ReviewCard from '@/components/ui/Notebook/ReviewCard';
import StagedFileTree from '@/components/ui/Notebook/StagedFileTree';
import FileTree from '@/components/ui/Notebook/FileTree';
import { NotebookProvider } from '@/components/ui/Notebook/NotebookContext';

interface NotebookData {
  id: string;
  title: string;
  lastEdited: string;
  icon: string;
  content?: string;
}

const DEFAULT_NOTEBOOKS: Record<string, NotebookData> = {
  'nb-1': { id: 'nb-1', title: 'Research Notes', lastEdited: '2 hours ago', icon: 'book' },
  'nb-2': { id: 'nb-2', title: 'Design Exploration', lastEdited: 'Yesterday', icon: 'palette' },
  'nb-3': { id: 'nb-3', title: 'Project Planning', lastEdited: '3 days ago', icon: 'clipboard' },
};

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  staged?: boolean;
  children?: FileNode[];
}

const INITIAL_FILE_TREE: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        children: [
          { id: 'App.tsx', name: 'App.tsx', type: 'file' },
          { id: 'Header.tsx', name: 'Header.tsx', type: 'file' },
        ],
      },
    ],
  },
  {
    id: 'docs',
    name: 'docs',
    type: 'folder',
    children: [
      { id: 'README.md', name: 'README.md', type: 'file' },
    ],
  },
  { id: 'package.json', name: 'package.json', type: 'file' },
];

function findFirstFolder(tree: FileNode[]): string | null {
  for (const node of tree) {
    if (node.type === 'folder') return node.id;
  }
  return null;
}

function addRealNodeToTree(tree: FileNode[], label: string): FileNode[] {
  const newNode: FileNode = {
    id: `real-${Date.now()}`,
    name: label.slice(0, 30),
    type: 'file',
    staged: false,
  };
  const targetFolderId = findFirstFolder(tree);
  if (!targetFolderId) {
    return [...tree, newNode];
  }
  return tree.map(node => {
    if (node.id === targetFolderId && node.type === 'folder') {
      return { ...node, children: [...(node.children ?? []).filter(c => !c.staged), newNode] };
    }
    return node;
  });
}

function addGhostNodeToTree(tree: FileNode[], label: string, stableId: string): FileNode[] {
  const ghostNode: FileNode = {
    id: `ghost-${stableId}`,
    name: label.slice(0, 30),
    type: 'file',
    staged: true,
  };
  const targetFolderId = findFirstFolder(tree);
  if (!targetFolderId) {
    return [...tree, { ...ghostNode }];
  }
  return tree.map(node => {
    if (node.id === targetFolderId && node.type === 'folder') {
      return {
        ...node,
        staged: true,
        children: [...(node.children ?? []).filter(c => !c.staged), ghostNode],
      };
    }
    return node;
  });
}

function clearStagedFromTree(tree: FileNode[]): FileNode[] {
  return tree.map(node => ({
    ...node,
    staged: false,
    children: node.children
      ? node.children.filter(c => !c.staged).map(c => ({ ...c, staged: false }))
      : undefined,
  }));
}

type CanvasTab = 'canvas' | 'agent-builder';

function NotebookWorkspaceInner({ params }: { params: { id: string } }) {
  const { id } = params;
  const [notebook, setNotebook] = useState<NotebookData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCanvasTab, setActiveCanvasTab] = useState<CanvasTab>('canvas');
  const [isFileTreeOpen, setIsFileTreeOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNotebookRef = useRef<NotebookData | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>(INITIAL_FILE_TREE);

  const addCanvasNoteRef = useRef<((text: string) => void) | null>(null);
  const appendEditorContentRef = useRef<((html: string) => void) | null>(null);

  const { proposals, registerCallbacks } = useProposals();

  const canvasProposal = proposals['canvas'];
  const ghostNoteText =
    canvasProposal && canvasProposal.status === 'pending'
      ? canvasProposal.proposedValue
      : null;

  const notebookProposal = proposals['notebook'];
  const pendingNotebookBlock =
    notebookProposal && notebookProposal.status === 'pending'
      ? { text: notebookProposal.proposedValue, taskName: notebookProposal.taskName }
      : null;

  const fileTreeProposal = proposals['file-tree'];
  const displayFileTree =
    fileTreeProposal && fileTreeProposal.status === 'pending'
      ? addGhostNodeToTree(fileTree, fileTreeProposal.proposedValue, fileTreeProposal.taskId)
      : fileTree;

  useEffect(() => {
    const stored = localStorage.getItem('notebooks');
    let userNotebooks: NotebookData[] = [];
    if (stored) {
      try { userNotebooks = JSON.parse(stored); } catch { /* ignore */ }
    }

    const found = DEFAULT_NOTEBOOKS[id] ?? userNotebooks.find((n: NotebookData) => n.id === id);
    if (found) {
      setNotebook(found);
    } else {
      setNotebook({ id, title: 'Untitled Notebook', lastEdited: 'Just now', icon: 'notebook' });
    }
    setTimeout(() => setIsLoaded(true), 50);
  }, [id]);

  const persistNotebook = useCallback((nb: NotebookData) => {
    if (DEFAULT_NOTEBOOKS[nb.id]) return;
    const stored = localStorage.getItem('notebooks');
    let list: NotebookData[] = [];
    if (stored) { try { list = JSON.parse(stored); } catch { /* ignore */ } }
    const idx = list.findIndex(n => n.id === nb.id);
    if (idx >= 0) list[idx] = nb;
    else list.unshift(nb);
    localStorage.setItem('notebooks', JSON.stringify(list));
  }, []);

  const scheduleSave = useCallback((nb: NotebookData) => {
    latestNotebookRef.current = nb;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistNotebook(nb), 1000);
  }, [persistNotebook]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        if (latestNotebookRef.current) {
          persistNotebook(latestNotebookRef.current);
        }
      }
    };
  }, [persistNotebook]);

  const handleTitleChange = (title: string) => {
    if (!notebook) return;
    const updated = { ...notebook, title, lastEdited: 'Just now' };
    setNotebook(updated);
    scheduleSave(updated);
  };

  const handleContentChange = (content: string) => {
    if (!notebook) return;
    const updated = { ...notebook, content, lastEdited: 'Just now' };
    setNotebook(updated);
    scheduleSave(updated);
  };

  useEffect(() => {
    registerCallbacks({
      onApplyNotebook: (text: string) => {
        const html = `<p>${text}</p>`;
        if (appendEditorContentRef.current) {
          appendEditorContentRef.current(html);
        }
      },
      onApplyCanvas: (label: string) => {
        if (addCanvasNoteRef.current) {
          addCanvasNoteRef.current(label);
        }
      },
      onApplyFileTree: (label: string) => {
        setFileTree(prev => addRealNodeToTree(clearStagedFromTree(prev), label));
      },
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fileTreeProposal && fileTreeProposal.status !== 'pending') {
      if (fileTreeProposal.status === 'dismissed') {
        setFileTree(prev => clearStagedFromTree(prev));
      }
    }
  }, [fileTreeProposal]);

  if (!notebook) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <NotebookProvider>
      <div
        className="fixed inset-0 w-screen h-screen bg-white flex flex-col overflow-hidden z-50"
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-out'
        }}
      >
        {/* Top bar */}
        <NotebookTopBar title={notebook.title} />

        {/* Main layout — pushed down below topbar */}
        <div className="flex flex-1 overflow-hidden pt-14">
          {/* Far-left Multitasker peek sidebar */}
          <MultitaskerSidebar notebookId={id} notebookContent={notebook.content ?? ''} />

          {/* Left pane — Rich text editor (~60%) */}
          <div className="flex-[6] border-r border-gray-100 overflow-hidden">
            <RichTextEditor
              initialTitle={notebook.title === 'Untitled Notebook' ? '' : notebook.title}
              initialContent={notebook.content ?? ''}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              appendContentRef={appendEditorContentRef}
              pendingBlock={pendingNotebookBlock}
            />
          </div>

          {/* Right panel — Canvas + Staged File Tree + Collapsible File Tree */}
          <div className="flex-[4] flex overflow-hidden bg-gray-50 relative">
            {/* Canvas area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Canvas tab header */}
              <div className="flex items-center border-b border-gray-200 bg-white px-3 pt-1 gap-1 flex-shrink-0">
                <button
                  onClick={() => setActiveCanvasTab('canvas')}
                  className={`px-3 py-2 text-[13px] font-medium -mb-px transition-colors ${
                    activeCanvasTab === 'canvas'
                      ? 'border-b-2 border-gray-800 text-gray-800'
                      : 'border-b-2 border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Canvas
                  </span>
                </button>
                <button
                  onClick={() => setActiveCanvasTab('agent-builder')}
                  className={`px-3 py-2 text-[13px] font-medium -mb-px transition-colors ${
                    activeCanvasTab === 'agent-builder'
                      ? 'border-b-2 border-gray-800 text-gray-800'
                      : 'border-b-2 border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 3a3 3 0 00-3 3v2a3 3 0 003 3h2a3 3 0 003-3V6a3 3 0 00-3-3H6zM16 3a3 3 0 00-3 3v2a3 3 0 003 3h2a3 3 0 003-3V6a3 3 0 00-3-3h-2zM3 16a3 3 0 013-3h2a3 3 0 013 3v2a3 3 0 01-3 3H6a3 3 0 01-3-3v-2zM13 19l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    Agent Builder
                  </span>
                </button>
                {activeCanvasTab === 'canvas' && (
                  <div className="ml-auto flex items-center gap-1 pb-1">
                    <span className="text-[10px] text-gray-300">dbl-click to add card</span>
                  </div>
                )}
              </div>

              {/* Canvas content */}
              <div className="flex-1 overflow-hidden relative">
                <div className={activeCanvasTab === 'canvas' ? 'absolute inset-0' : 'absolute inset-0 invisible pointer-events-none'}>
                  <NotebookCanvas
                    ghostNoteText={ghostNoteText}
                    addNoteRef={addCanvasNoteRef}
                    appendNotesRef={appendEditorContentRef}
                  />
                </div>
                {activeCanvasTab === 'agent-builder' && (
                  <div className="absolute inset-0">
                    <AgentCanvas />
                  </div>
                )}
              </div>

              {/* Staged file tree panel — only visible in Canvas tab */}
              {activeCanvasTab === 'canvas' && (
                <StagedFileTree fileTree={displayFileTree} />
              )}
            </div>

            {/* Collapsible File Tree — right edge */}
            {/* Toggle button */}
            <button
              onClick={() => setIsFileTreeOpen(prev => !prev)}
              className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-6 h-16 bg-white border border-gray-200 rounded-l-md shadow-sm hover:bg-gray-50 transition-all duration-200"
              aria-label={isFileTreeOpen ? 'Close file tree' : 'Open file tree'}
              style={{ right: isFileTreeOpen ? 220 : 0 }}
            >
              <svg
                className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isFileTreeOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* File tree panel */}
            <div
              className="absolute top-0 right-0 h-full bg-white border-l border-gray-100 flex flex-col overflow-hidden transition-all duration-200 z-20"
              style={{ width: isFileTreeOpen ? 220 : 0, opacity: isFileTreeOpen ? 1 : 0 }}
            >
              {isFileTreeOpen && <FileTree />}
            </div>
          </div>
        </div>

        {/* Floating review card */}
        <ReviewCard />
      </div>
    </NotebookProvider>
  );
}

export default function NotebookWorkspace({ params }: { params: { id: string } }) {
  return (
    <ProposalProvider>
      <NotebookWorkspaceInner params={params} />
    </ProposalProvider>
  );
}
