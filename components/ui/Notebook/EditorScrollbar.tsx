'use client';

import { useRef, useCallback, useState, useLayoutEffect } from 'react';

const PAGE_HEIGHT = 800;

interface EditorScrollbarProps {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  onScrollTo: (scrollTop: number) => void;
  onInsertSection: (scrollTop: number) => void;
}

export default function EditorScrollbar({
  scrollTop,
  scrollHeight,
  clientHeight,
  onScrollTo,
  onInsertSection,
}: EditorScrollbarProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [railHeight, setRailHeight] = useState(0);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const ro = new ResizeObserver(() => {
      setRailHeight(rail.getBoundingClientRect().height);
    });
    ro.observe(rail);
    setRailHeight(rail.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);

  const safeScrollHeight = scrollHeight > 0 ? scrollHeight : 1;
  const safeClientHeight = clientHeight > 0 ? clientHeight : 1;
  const safeRailHeight = railHeight > 0 ? railHeight : safeClientHeight;

  const canScroll = safeScrollHeight > safeClientHeight;
  const maxScroll = Math.max(safeScrollHeight - safeClientHeight, 1);
  const thumbRatio = Math.min(safeClientHeight / safeScrollHeight, 1);
  const thumbHeight = Math.max(thumbRatio * safeRailHeight, 28);
  const thumbTop = canScroll
    ? Math.min((scrollTop / maxScroll) * (safeRailHeight - thumbHeight), safeRailHeight - thumbHeight)
    : 0;

  const pageCount = Math.max(Math.ceil(safeScrollHeight / PAGE_HEIGHT), 1);

  const getRailY = useCallback((clientY: number): number => {
    const rail = railRef.current;
    if (!rail) return 0;
    const rect = rail.getBoundingClientRect();
    return Math.min(Math.max(clientY - rect.top, 0), rect.height);
  }, []);

  const yToScrollTop = useCallback((y: number): number => {
    return (y / safeRailHeight) * maxScroll;
  }, [safeRailHeight, maxScroll]);

  const handleRailClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.thumb === 'true') return;
    const y = getRailY(e.clientY);
    onScrollTo(yToScrollTop(y));
  }, [getRailY, yToScrollTop, onScrollTo]);

  const handleRailDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.thumb === 'true') return;
    e.preventDefault();
    const y = getRailY(e.clientY);
    onInsertSection(yToScrollTop(y));
  }, [getRailY, yToScrollTop, onInsertSection]);

  const handleThumbMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    const startY = e.clientY;
    const startScrollTop = scrollTop;

    const onMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dy = ev.clientY - startY;
      const delta = (dy / safeRailHeight) * maxScroll;
      onScrollTo(Math.min(Math.max(startScrollTop + delta, 0), maxScroll));
    };

    const onUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [scrollTop, maxScroll, safeRailHeight, onScrollTo]);

  return (
    <div
      ref={railRef}
      className="absolute right-0 top-0 bottom-0 w-3.5 cursor-pointer select-none z-10"
      style={{ background: 'rgba(0,0,0,0.03)' }}
      onClick={handleRailClick}
      onDoubleClick={handleRailDoubleClick}
    >
      {/* Scrollbar thumb */}
      {railHeight > 0 && (
        <div
          data-thumb="true"
          onMouseDown={handleThumbMouseDown}
          className="absolute left-1 right-1 rounded-full cursor-grab active:cursor-grabbing"
          style={{
            top: thumbTop,
            height: thumbHeight,
            background: 'rgba(0,0,0,0.18)',
          }}
        />
      )}

      {/* Page dots */}
      {railHeight > 0 && Array.from({ length: pageCount }, (_, i) => {
        const dotScrollTop = i * PAGE_HEIGHT;
        const dotY = (dotScrollTop / safeScrollHeight) * safeRailHeight;
        const isActive = scrollTop >= dotScrollTop - PAGE_HEIGHT / 2 && scrollTop < dotScrollTop + PAGE_HEIGHT / 2;
        return (
          <div
            key={i}
            className="absolute left-1/2 rounded-full transition-all duration-150"
            style={{
              top: Math.max(0, dotY),
              width: isActive ? 8 : 6,
              height: isActive ? 8 : 6,
              transform: 'translateX(-50%)',
              background: isActive ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.2)',
              marginTop: -4,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onScrollTo(dotScrollTop);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
            }}
          />
        );
      })}
    </div>
  );
}
