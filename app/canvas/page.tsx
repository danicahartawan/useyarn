'use client';

import InfiniteCanvas from '@/components/ui/Canvas/InfiniteCanvas';

export default function CanvasPage() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden z-50">
      <InfiniteCanvas />
    </div>
  );
}
