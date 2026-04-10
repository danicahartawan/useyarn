'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Palette, ClipboardList, NotebookPen, GitBranch } from 'lucide-react';
import AgentCanvas from '@/components/ui/Notebook/AgentCanvas';

function NotebookIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className ?? 'w-8 h-8';
  switch (icon) {
    case 'book': return <BookOpen className={cls} />;
    case 'palette': return <Palette className={cls} />;
    case 'clipboard': return <ClipboardList className={cls} />;
    case 'notebook':
    default: return <NotebookPen className={cls} />;
  }
}

interface Notebook {
  id: string;
  title: string;
  lastEdited: string;
  icon: string;
  preview?: string;
}

const DEFAULT_NOTEBOOKS: Notebook[] = [
  { id: 'nb-1', title: 'Research Notes', lastEdited: '2 hours ago', icon: 'book', preview: 'Exploring transformer architecture and attention mechanisms...' },
  { id: 'nb-2', title: 'Design Exploration', lastEdited: 'Yesterday', icon: 'palette', preview: 'Color palette ideas and layout sketches for the new interface...' },
  { id: 'nb-3', title: 'Project Planning', lastEdited: '3 days ago', icon: 'clipboard', preview: 'Milestones, tasks, and key deliverables for Q2...' },
];

const COVER_COLORS = [
  { spine: '#1e2a45', cover: '#2d3f6b' },
  { spine: '#2a1e45', cover: '#4a2d7a' },
  { spine: '#1e3528', cover: '#2d6644' },
];

type Phase = 'idle' | 'centering' | 'opening';

interface OpenState {
  nb: Notebook;
  colors: typeof COVER_COLORS[0];
  fromRect: { x: number; y: number; w: number; h: number };
}

export default function NotebooksPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>(DEFAULT_NOTEBOOKS);
  const [phase, setPhase] = useState<Phase>('idle');
  const [openState, setOpenState] = useState<OpenState | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeTab, setActiveTab] = useState<'notebooks' | 'agent-builder'>('notebooks');

  useEffect(() => {
    const stored = localStorage.getItem('notebooks');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotebooks([...DEFAULT_NOTEBOOKS, ...parsed.filter((n: Notebook) => !DEFAULT_NOTEBOOKS.find(d => d.id === n.id))]);
      } catch { /* use defaults */ }
    }
  }, []);

  const handleOpen = (nb: Notebook, colors: typeof COVER_COLORS[0]) => {
    if (phase !== 'idle') return;
    const el = cardRefs.current.get(nb.id);
    const rect = el?.getBoundingClientRect() ?? { x: 0, y: 0, width: 200, height: 200 };
    setOpenState({
      nb,
      colors,
      fromRect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
    });
    setPhase('centering');
    // After centering, open the book
    setTimeout(() => setPhase('opening'), 500);
    // Navigate after open animation
    setTimeout(() => router.push(`/notebooks/${nb.id}`), 1350);
  };

  const createNotebook = () => {
    const id = `nb-${Date.now()}`;
    const nb: Notebook = { id, title: 'Untitled Notebook', lastEdited: 'Just now', icon: 'notebook', preview: '' };
    const existing = notebooks.filter(n => !DEFAULT_NOTEBOOKS.find(d => d.id === n.id));
    localStorage.setItem('notebooks', JSON.stringify([nb, ...existing]));
    router.push(`/notebooks/${nb.id}`);
  };

  // Book dimensions when centered
  const BOOK_W = 340;
  const BOOK_H = 420;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gray-50 overflow-auto z-50">
      {/* ── Two-stage animation overlay ── */}
      <AnimatePresence>
        {openState && phase !== 'idle' && (
          <>
            {/* Backdrop dims the page */}
            <motion.div
              className="fixed inset-0 z-[90] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* Stage 1: closed book travels from card → center */}
            {phase === 'centering' && (
              <motion.div
                className="fixed z-[100] rounded-xl overflow-hidden shadow-2xl"
                style={{
                  width: openState.fromRect.w,
                  height: openState.fromRect.h,
                  top: openState.fromRect.y,
                  left: openState.fromRect.x,
                  background: `linear-gradient(135deg, ${openState.colors.spine} 0%, ${openState.colors.cover} 100%)`,
                }}
                animate={{
                  width: BOOK_W,
                  height: BOOK_H,
                  top: `calc(50vh - ${BOOK_H / 2}px)`,
                  left: `calc(50vw - ${BOOK_W / 2}px)`,
                  borderRadius: 16,
                }}
                transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Spine */}
                <div className="absolute left-0 top-0 bottom-0 w-7 bg-black/30 rounded-l-xl" />
                <div className="relative z-10 flex flex-col justify-between h-full p-8 pl-10">
                  <div>
                    <div className="mb-4">
                      <NotebookIcon icon={openState.nb.icon} className="w-10 h-10 text-white/80" />
                    </div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{openState.nb.title}</h2>
                    <p className="text-white/50 text-sm mt-2">{openState.nb.lastEdited}</p>
                  </div>
                  <div className="space-y-2">
                    {[75, 90, 60].map((w, i) => (
                      <div key={i} className="h-1.5 rounded-full bg-white/20" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stage 2: book opens — left cover swings, right interior reveals */}
            {phase === 'opening' && (
              <div
                className="fixed z-[100]"
                style={{
                  width: BOOK_W,
                  height: BOOK_H,
                  top: `calc(50vh - ${BOOK_H / 2}px)`,
                  left: `calc(50vw - ${BOOK_W / 2}px)`,
                  perspective: '1400px',
                }}
              >
                {/* Interior right page (always underneath) */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl flex"
                  style={{ background: '#faf9f6' }}
                >
                  {/* Gutter */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 z-10" />
                  {/* Left interior page */}
                  <div className="w-1/2 h-full p-6 flex flex-col justify-center gap-2.5">
                    <p className="text-[9px] uppercase tracking-widest text-gray-300 mb-2">Notes</p>
                    {[80, 65, 90, 55, 75, 60, 70].map((w, i) => (
                      <motion.div key={i} className="h-1.5 rounded-full bg-gray-100"
                        style={{ width: `${w}%` }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.04 }}
                      />
                    ))}
                  </div>
                  {/* Right interior page */}
                  <div className="w-1/2 h-full p-6 flex flex-col justify-between">
                    <div>
                      <NotebookIcon icon={openState.nb.icon} className="w-7 h-7 text-gray-300" />
                    </div>
                    <div className="space-y-2">
                      {[70, 85, 55, 65].map((w, i) => (
                        <motion.div key={i} className="h-1.5 rounded-full bg-gray-100"
                          style={{ width: `${w}%` }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 + i * 0.04 }}
                        />
                      ))}
                    </div>
                    <motion.p
                      className="text-[9px] text-gray-300"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      Opening…
                    </motion.p>
                  </div>
                </div>

                {/* Cover swings open (rotates around left spine) */}
                <motion.div
                  className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${openState.colors.spine} 0%, ${openState.colors.cover} 100%)`,
                    transformOrigin: 'left center',
                    transformStyle: 'preserve-3d',
                  }}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: -160 }}
                  transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-7 bg-black/30 rounded-l-xl" />
                  <div className="relative z-10 flex flex-col justify-between h-full p-8 pl-10">
                    <div>
                      <div className="mb-4">
                        <NotebookIcon icon={openState.nb.icon} className="w-10 h-10 text-white/80" />
                      </div>
                      <h2 className="text-2xl font-bold text-white leading-tight">{openState.nb.title}</h2>
                      <p className="text-white/50 text-sm mt-2">{openState.nb.lastEdited}</p>
                    </div>
                    <div className="space-y-2">
                      {[75, 90, 60].map((w, i) => (
                        <div key={i} className="h-1.5 rounded-full bg-white/20" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-3 left-0 right-0 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <Link href="/" className="h-8 w-8 flex items-center justify-center bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-2.5 gap-1.5 text-xs text-gray-600">
            <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-medium text-gray-700">Notebooks</span>
          </div>

          {/* Mode tabs */}
          <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-1 gap-0.5">
            <button
              onClick={() => setActiveTab('notebooks')}
              className={`h-6 px-2.5 flex items-center gap-1.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'notebooks' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Notebooks
            </button>
            <button
              onClick={() => setActiveTab('agent-builder')}
              className={`h-6 px-2.5 flex items-center gap-1.5 rounded text-[11px] font-medium transition-colors ${
                activeTab === 'agent-builder' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <GitBranch className="w-3 h-3" />
              Agent Builder
            </button>
          </div>
        </div>
        {activeTab === 'notebooks' && (
          <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-3 text-[11px] font-mono text-gray-500">
            {notebooks.length} notebooks
          </div>
        )}
      </div>

      {/* Agent Builder Canvas */}
      {activeTab === 'agent-builder' && (
        <div className="absolute inset-0 pt-14">
          <AgentCanvas />
        </div>
      )}

      {/* Grid */}
      {activeTab === 'notebooks' && (
        <div className="pt-20 pb-8 px-6 max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Your Notebooks</h1>
            <p className="text-sm text-gray-400 mt-0.5">Combine rich text, an infinite canvas, and your project files.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* New Notebook */}
            <motion.button
              onClick={createNotebook}
              className="flex flex-col items-center justify-center gap-3 h-52 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all group"
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-gray-400 transition-colors">
                <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm text-gray-400 group-hover:text-gray-500 font-medium">New Notebook</span>
            </motion.button>

            {notebooks.map((nb, i) => {
              const colors = COVER_COLORS[i % COVER_COLORS.length];
              return (
                <motion.div
                  key={nb.id}
                  ref={el => { if (el) cardRefs.current.set(nb.id, el); }}
                  className="relative h-52 cursor-pointer"
                  style={{ perspective: '1000px' }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleOpen(nb, colors)}
                >
                  {/* Interior underneath */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ background: '#faf9f6' }}>
                    <div className="flex h-full">
                      <div className="w-1/2 p-3 border-r border-gray-100 flex flex-col gap-1.5 justify-center">
                        {[70, 90, 60, 80].map((w, j) => (
                          <div key={j} className="h-1.5 rounded-full bg-gray-100" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                      <div className="w-1/2 p-3 flex flex-col gap-1.5 justify-center">
                        {[80, 65, 75].map((w, j) => (
                          <div key={j} className="h-1.5 rounded-full bg-gray-100" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cover — peels back slightly on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-xl overflow-hidden shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${colors.spine} 0%, ${colors.cover} 100%)`,
                      transformOrigin: 'left center',
                      transformStyle: 'preserve-3d',
                    }}
                    whileHover={{ rotateY: -10, boxShadow: '6px 6px 28px rgba(0,0,0,0.22)' }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-5 bg-black/28 rounded-l-xl" />
                    <div className="relative z-10 flex flex-col justify-between h-full p-5 pl-7">
                      <div>
                        <div className="mb-2">
                          <NotebookIcon icon={nb.icon} className="w-7 h-7 text-white/80" />
                        </div>
                        <h3 className="text-sm font-semibold text-white leading-tight">{nb.title}</h3>
                        <p className="text-[10px] text-white/50 mt-1">{nb.lastEdited}</p>
                      </div>
                      <div className="space-y-1.5">
                        {[70, 85, 55].map((w, j) => (
                          <div key={j} className="h-1 rounded-full bg-white/18" style={{ width: `${w}%` }} />
                        ))}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                            <span className="text-[9px] text-white/30">Canvas + Files</span>
                          </div>
                          <svg className="w-3 h-3 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
