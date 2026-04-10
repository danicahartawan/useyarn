'use client';

import Link from 'next/link';

interface NotebookTopBarProps {
  title: string;
}

export default function NotebookTopBar({ title }: NotebookTopBarProps) {
  return (
    <div className="absolute top-3 left-0 right-0 flex items-center justify-between px-3 pointer-events-none z-20">
      {/* Left — breadcrumb pill */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <Link
          href="/notebooks"
          className="h-8 w-8 flex items-center justify-center bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
          aria-label="Back to notebooks"
        >
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
          <Link href="/notebooks" className="flex items-center gap-1 hover:text-gray-900 transition-colors text-gray-500">
            Notebooks
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-medium text-gray-700 max-w-[160px] truncate">{title}</span>
        </div>
      </div>

      {/* Right — action buttons */}
      <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-1 gap-0.5 pointer-events-auto">
        {[
          { label: 'Share', path: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' },
          { label: 'Settings', path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
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
