'use client';

interface CanvasTopBarProps {
  onToggleSidebar: () => void;
}

export default function CanvasTopBar({ onToggleSidebar }: CanvasTopBarProps) {
  return (
    <div className="absolute top-3 left-0 right-0 flex items-center justify-between px-3 pointer-events-none z-20">

      {/* Left — breadcrumb pill */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="h-8 w-8 flex items-center justify-center bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb pill */}
        <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-2.5 gap-1.5 text-xs text-gray-600">
          {/* Org icon */}
          <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <button className="flex items-center gap-1 hover:text-gray-900 transition-colors font-medium">
            Andrew&apos;s Org
            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <span className="text-gray-300">/</span>
          {/* Canvas icon */}
          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <button className="flex items-center gap-1 hover:text-gray-900 transition-colors font-medium">
            My Canvas
            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center — stats pill */}
      <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-3 gap-4 text-[11px] font-mono text-gray-500 pointer-events-auto">
        <span>TKN 8,469</span>
        <span className="text-gray-200">|</span>
        <span>AGT 7</span>
        <span className="text-gray-200">|</span>
        <span>Z 63%</span>
        <span className="text-gray-200">|</span>
        <span>492 , 311</span>
      </div>

      {/* Right — action buttons pill */}
      <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-1 gap-0.5 pointer-events-auto">
        {[
          { label: 'Search', path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          { label: 'Share', path: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
          { label: 'Settings', path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'View', path: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
          { label: 'Tools', path: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
          { label: 'Delete', path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
        ].map(({ label, path }) => (
          <button
            key={label}
            className="w-7 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
            aria-label={label}
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={path} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
