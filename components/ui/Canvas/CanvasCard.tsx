'use client';

import { useState, useRef } from 'react';
import { FileText, Link2, Flower2 } from 'lucide-react';

function resolveIcon(icon: string): React.ReactNode {
  switch (icon) {
    case 'file-text': return <FileText className="w-10 h-10 text-gray-400" />;
    case 'link': return <Link2 className="w-10 h-10 text-gray-400" />;
    case 'flower': return <Flower2 className="w-10 h-10 text-gray-400" />;
    default: return null;
  }
}

interface CanvasCardProps {
  id: string;
  x: number;
  y: number;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  scale: number;
  offset: { x: number; y: number };
  onPositionChange: (id: string, newX: number, newY: number) => void;
  editableSubtitle?: boolean;
  onSubtitleChange?: (id: string, value: string) => void;
  onCardClick?: (id: string) => void;
}

export default function CanvasCard({
  id,
  x,
  y,
  title,
  subtitle,
  description,
  icon,
  scale,
  offset,
  onPositionChange,
  editableSubtitle,
  onSubtitleChange,
  onCardClick
}: CanvasCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  const DRAG_THRESHOLD = 5;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
    setDragStart({
      x: e.clientX / scale - x,
      y: e.clientY / scale - y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDownPos.current) return;

    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);

    if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
      hasDragged.current = true;
      setIsDragging(true);
    }

    if (isDragging || hasDragged.current) {
      const newX = e.clientX / scale - dragStart.x;
      const newY = e.clientY / scale - dragStart.y;
      onPositionChange(id, newX, newY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasDragged.current && mouseDownPos.current) {
      onCardClick?.(id);
    }
    setIsDragging(false);
    mouseDownPos.current = null;
    hasDragged.current = false;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
    mouseDownPos.current = null;
    hasDragged.current = false;
  };

  return (
    <div
      ref={cardRef}
      className={`absolute bg-white rounded-lg shadow-md p-3 cursor-move transition-all hover:shadow-lg ${
        isDragging ? 'shadow-xl' : ''
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: '220px',
        zIndex: isDragging ? 1000 : 1
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Icon */}
      {icon && resolveIcon(icon) && (
        <div className="flex justify-center mb-2">
          {resolveIcon(icon)}
        </div>
      )}

      {/* Content */}
      <div className="space-y-1">
        {/* Title */}
        <div className="flex items-center gap-2">
          {!icon && (
            <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              <svg
                className="w-3 h-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Subtitle */}
        {editableSubtitle ? (
          <input
            type="text"
            className="text-xs text-gray-500 w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-300 focus:bg-blue-50 rounded px-1 -mx-1"
            value={subtitle ?? ''}
            onChange={(e) => onSubtitleChange?.(id, e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder="Add subtitle..."
          />
        ) : subtitle ? (
          <p className="text-xs text-gray-500">{subtitle}</p>
        ) : null}

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description}</p>
        )}
      </div>

      {/* Action button or status indicator */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
          <span className="text-xs text-gray-500">Active</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
