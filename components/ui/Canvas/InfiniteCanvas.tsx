'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { FileText, Link2, Download } from 'lucide-react';
import CanvasCard from './CanvasCard';
import CanvasTopBar from './CanvasTopBar';
import CanvasSidebar from './CanvasSidebar';
import WritingSpacePanel from './WritingSpacePanel';
import SourcesPanel from './SourcesPanel';
import ChatPanel, { NewCardData } from './ChatPanel';
import SidebarWritingCard from './SidebarWritingCard';

interface CardData {
  id: string;
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
}

interface Connection {
  from: string;
  to: string;
}

export default function InfiniteCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const YARN_ID = '1';
  const [cards, setCards] = useState<CardData[]>([
    {
      id: YARN_ID,
      x: 440,
      y: 60,
      title: 'yarn',
      subtitle: 'Ready to assist...',
      icon: 'flower'
    }
  ]);
  const [chatCardIds, setChatCardIds] = useState<string[]>([]);
  const [isComputingNodes, setIsComputingNodes] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dynamicConnections, setDynamicConnections] = useState<Connection[]>([]);
  const allConnections = [...dynamicConnections];

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.1, scale + delta), 4);
    setScale(newScale);
  }, [scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Handle panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setIsPanning(true);
      setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Update card position when dragged
  const updateCardPosition = (id: string, newX: number, newY: number) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, x: newX, y: newY } : card
    ));
  };

  // Update card subtitle
  const updateCardSubtitle = (id: string, value: string) => {
    setCards(cards.map(card =>
      card.id === id ? { ...card, subtitle: value } : card
    ));
  };

  // Handle card click — only open panel for Writing Space / Sources cards
  const handleCardClick = (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return;
    const subtitle = card.subtitle ?? '';
    if (subtitle === 'Writing Space' || subtitle === 'Sources') {
      setOpenCardId((prev) => (prev === id ? null : id));
    }
  };

  // Add cards from chat search results — clears old chat cards, batches card+connection reveal
  const handleAddCards = async (newCardData: NewCardData[]) => {
    setIsComputingNodes(true);

    // Layout: yarn sits at top (x≈440, y≈60); results fan out below in a 3-col grid
    const cols = 3;
    const colW = 280;
    const rowH = 175;
    const gridStartX = 140;
    const gridStartY = 300;

    const ts = Date.now();
    const newCards: CardData[] = newCardData.map((d, i) => ({
      id: `chat-${ts}-${i}`,
      x: gridStartX + (i % cols) * colW,
      y: gridStartY + Math.floor(i / cols) * rowH,
      title: d.title,
      subtitle: d.subtitle,
      description: d.description
    }));

    // All nodes for embedding: yarn + new results
    const yarnCard = cards.find((c) => c.id === YARN_ID)!;
    const nodes = [yarnCard, ...newCards].map((c) => ({
      id: c.id,
      text: [c.title, c.subtitle, c.description].filter(Boolean).join(' ')
    }));

    // Always connect yarn → every new card (radial from top)
    const yarnLinks: Connection[] = newCards.map((c) => ({ from: YARN_ID, to: c.id }));

    let similarityLinks: Connection[] = [];
    try {
      const res = await fetch('/api/embed-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes })
      });
      const data = await res.json();
      if (data.pairs?.length) {
        // Keep only result↔result pairs (exclude yarn links, already handled)
        similarityLinks = (data.pairs as { from: string; to: string }[]).filter(
          (p) => p.from !== YARN_ID && p.to !== YARN_ID
        );
      }
    } catch {
      // No similarity links on error — yarn links still render
    }

    // Commit everything at once: remove old chat cards, add new ones + connections
    setCards((prev) => [
      ...prev.filter((c) => c.id === YARN_ID),
      ...newCards
    ]);
    setChatCardIds(newCards.map((c) => c.id));
    setDynamicConnections([...yarnLinks, ...similarityLinks]);
    setIsComputingNodes(false);
  };

  // Add a single dropped card at a canvas position, then recompute similarity
  const addDroppedCard = async (
    cardData: { title: string; subtitle?: string; description?: string; icon?: string },
    canvasX: number,
    canvasY: number
  ) => {
    const id = `drop-${Date.now()}`;
    const newCard: CardData = { id, x: canvasX - 110, y: canvasY - 50, ...cardData };

    // Add card immediately (we know its position — no need to wait for similarity)
    setCards((prev) => [...prev, newCard]);

    // Recompute connections for all cards including new one
    const allCards = [...cards, newCard];
    const nodes = allCards.map((c) => ({
      id: c.id,
      text: [c.title, c.subtitle, c.description].filter(Boolean).join(' ')
    }));

    try {
      const res = await fetch('/api/embed-similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes })
      });
      const data = await res.json();
      if (data.pairs?.length) {
        setDynamicConnections(
          (data.pairs as { from: string; to: string }[]).map((p) => ({ from: p.from, to: p.to }))
        );
      } else {
        // Fallback: connect yarn → new card
        setDynamicConnections((prev) => [...prev, { from: YARN_ID, to: id }]);
      }
    } catch {
      setDynamicConnections((prev) => [...prev, { from: YARN_ID, to: id }]);
    }
  };

  // Drag over — allow drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the canvas entirely
    if (!canvasRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  // Drop handler — detect PDF file or URL text
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Convert drop screen position → canvas coordinates
    const canvasX = (e.clientX - rect.left - offset.x) / scale;
    const canvasY = (e.clientY - rect.top - offset.y) / scale;

    // --- PDF file drop ---
    const files = Array.from(e.dataTransfer.files);
    const pdfs = files.filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    for (const pdf of pdfs) {
      const form = new FormData();
      form.append('file', pdf);
      try {
        const res = await fetch('/api/parse-pdf', { method: 'POST', body: form });
        const data = await res.json();
        if (!data.error) {
          await addDroppedCard(
            { title: data.title, subtitle: data.subtitle, description: data.description, icon: 'file-text' },
            canvasX,
            canvasY + pdfs.indexOf(pdf) * 200
          );
        }
      } catch { /* silently skip */ }
    }
    if (pdfs.length > 0) return;

    // --- URL / link drop ---
    const text =
      e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain') ||
      '';

    const urlCandidates = text.split('\n').map((s) => s.trim()).filter((s) => {
      try { return s.startsWith('http'); } catch { return false; }
    });

    for (const url of urlCandidates.slice(0, 3)) {
      try {
        const res = await fetch(`/api/fetch-link?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!data.error) {
          await addDroppedCard(
            { title: data.title, subtitle: data.subtitle, description: data.description, icon: 'link' },
            canvasX,
            canvasY + urlCandidates.indexOf(url) * 200
          );
        }
      } catch { /* silently skip */ }
    }
  };

  // Auto-place a card near existing cards (used by sidebar drop/paste)
  const addCardAuto = async (cardData: { title: string; subtitle?: string; description?: string; icon?: string }) => {
    // Place in a spiral around yarn — below and staggered right
    const idx = cards.length;
    const cols = 3;
    const colW = 280;
    const rowH = 175;
    const gridStartX = 140;
    const gridStartY = 300;
    const x = gridStartX + (idx % cols) * colW;
    const y = gridStartY + Math.floor(idx / cols) * rowH;
    await addDroppedCard(cardData, x + 110, y + 50);
  };

  // Get card position by id
  const getCardById = (id: string) => cards.find(card => card.id === id);

  const openCard = openCardId ? cards.find(c => c.id === openCardId) : null;

  return (
    <div className="relative w-full h-full bg-gray-50 flex">
      {/* Top bar - floating on canvas */}
      <CanvasTopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Sidebar */}
      <CanvasSidebar isOpen={sidebarOpen} onOpenChat={() => { setChatOpen(true); setSidebarOpen(false); }} onAddCard={addCardAuto} />

      {/* Chat panel — slides in from left, next to sidebar */}
      {chatOpen && (
        <div
          className="h-full flex-shrink-0 overflow-hidden"
          style={{ animation: 'ic-slide-in-left 0.2s ease-out', zIndex: 5 }}
        >
          <ChatPanel
            onClose={() => setChatOpen(false)}
            projectTitle="Research Project"
            onAddCards={handleAddCards}
          />
        </div>
      )}

      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="relative flex-1 h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Floating writing card — visible only when sidebar is collapsed */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 transition-all duration-300"
          style={{ zIndex: 20 }}
        >
          <div
            className="pointer-events-auto h-full"
            style={{
              transform: sidebarOpen ? 'translateX(-120%)' : 'translateX(0)',
              transition: 'transform 0.3s ease, opacity 0.3s ease',
              opacity: sidebarOpen ? 0 : 1,
            }}
          >
            <SidebarWritingCard />
          </div>
        </div>

        {/* Drag-over drop zone overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(239,246,255,0.75)', border: '2px dashed #93c5fd', backdropFilter: 'blur(1px)' }}>
            <div className="flex items-center gap-2 bg-white rounded-xl px-5 py-3 shadow-lg border border-blue-100">
              <Download className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-600">Drop PDF or link here</span>
            </div>
          </div>
        )}

        {/* Loading overlay while computing nodes + connections */}
        {isComputingNodes && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50"
            style={{ background: 'rgba(249,250,251,0.82)', backdropFilter: 'blur(2px)' }}
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gray-400"
                  style={{ animation: `ic-bounce 1s ease-in-out ${i * 0.18}s infinite` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-medium tracking-wide">Computing connections…</span>
          </div>
        )}

        {/* Background grid pattern */}
        <div
          className="canvas-background absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: `${40 * scale}px ${40 * scale}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`
          }}
        />

        {/* Canvas content container */}
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
          className="absolute top-0 left-0 w-full h-full"
        >
          {/* Connection lines */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            {allConnections.map((conn, idx) => {
              const fromCard = getCardById(conn.from);
              const toCard = getCardById(conn.to);
              if (!fromCard || !toCard) return null;

              const x1 = fromCard.x + 110;
              const y1 = fromCard.y + 50;
              const x2 = toCard.x + 110;
              const y2 = toCard.y + 50;

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;
              const dx = x2 - x1;
              const dy = y2 - y1;
              const curve = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3;

              return (
                <g key={idx}>
                  <path
                    d={`M ${x1} ${y1} Q ${midX} ${y1 + curve} ${midX} ${midY} Q ${midX} ${y2 - curve} ${x2} ${y2}`}
                    stroke="#d1d5db"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />
                </g>
              );
            })}
          </svg>

          {/* Cards */}
          {cards.map((card) => (
            <CanvasCard
              key={card.id}
              id={card.id}
              x={card.x}
              y={card.y}
              title={card.title}
              subtitle={card.subtitle}
              description={card.description}
              icon={card.icon}
              scale={scale}
              offset={offset}
              onPositionChange={updateCardPosition}
              editableSubtitle={card.id === '1'}
              onSubtitleChange={updateCardSubtitle}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200" style={{ zIndex: 10 }}>
          <button
            onClick={() => setScale(Math.min(scale + 0.1, 4))}
            className="px-3 py-2 hover:bg-gray-100 rounded font-mono text-sm transition-colors"
          >
            +
          </button>
          <div className="px-3 py-1 text-center text-xs text-gray-600 font-mono">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={() => setScale(Math.max(scale - 0.1, 0.1))}
            className="px-3 py-2 hover:bg-gray-100 rounded font-mono text-sm transition-colors"
          >
            −
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
            className="px-3 py-2 hover:bg-gray-100 rounded text-xs transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Right panel — slides in from right */}
      {openCard && (
        <div
          className="h-full flex-shrink-0 overflow-hidden"
          style={{
            animation: 'ic-slide-in-right 0.2s ease-out'
          }}
        >
          {openCard.subtitle === 'Writing Space' && (
            <WritingSpacePanel
              cardTitle={openCard.title}
              onClose={() => setOpenCardId(null)}
            />
          )}
          {openCard.subtitle === 'Sources' && (
            <SourcesPanel
              cardTitle={openCard.title}
              onClose={() => setOpenCardId(null)}
            />
          )}
        </div>
      )}

      <style>{`
        @keyframes ic-slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes ic-slide-in-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes ic-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
