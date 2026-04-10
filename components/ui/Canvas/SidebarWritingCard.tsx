'use client';

import { useState } from 'react';
import { PenLine } from 'lucide-react';

export default function SidebarWritingCard() {
  const [notes, setNotes] = useState('');

  return (
    <div
      className="absolute left-3 top-1/2 z-20 flex flex-col rounded-xl shadow-lg overflow-hidden"
      style={{
        transform: 'translateY(-50%)',
        width: '200px',
        background: '#1e1f23',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
        <PenLine className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <span className="text-[11px] font-medium text-gray-400 tracking-wide">Notes</span>
      </div>
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Jot something down..."
        aria-label="Quick notes"
        className="flex-1 resize-none bg-transparent text-[12px] text-gray-200 placeholder-gray-600 px-3 py-2.5 outline-none leading-relaxed"
        style={{ minHeight: '140px', maxHeight: '320px' }}
      />
    </div>
  );
}
