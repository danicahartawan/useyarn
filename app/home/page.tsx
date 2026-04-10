'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const PRIVATE_PROJECTS = [
  {
    id: 'proj-1',
    name: 'journal club 1: tolman machine',
    folders: [
      { id: 'f-1', name: 'Untitled', children: [] },
      {
        id: 'f-2',
        name: 'Untitled',
        active: true,
        children: [{ id: 'f-3', name: 'Untitled' }],
      },
    ],
  },
];

export default function FolderBrowserPage() {
  const router = useRouter();

  const handleNavigateToCanvas = () => {
    router.push('/canvas');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: '#fafaf9', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '14px', color: '#57534e' }}>
      {/* Left Sidebar */}
      <aside style={{ width: '220px', flexShrink: 0, background: '#fff', borderRight: '1px solid #e7e5e4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sidebar Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #e7e5e4', minHeight: '48px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 500, color: '#57534e', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px' }}>
            <span>danicahartawan</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', color: '#a8a29e' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', color: '#a8a29e' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[
            { label: 'Home', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
            { label: 'Library', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
            { label: 'Agent', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
          ].map(item => (
            <button key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', fontSize: '13px', color: '#57534e', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              <span style={{ color: '#a8a29e', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Private Section */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 16px 6px' }}>Private</div>
        <div style={{ padding: '0 10px', overflowY: 'auto', flex: 1 }}>
          {PRIVATE_PROJECTS.map(project => (
            <div key={project.id}>
              <button
                onClick={handleNavigateToCanvas}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 6px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#57534e', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', overflow: 'hidden' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: '#a8a29e' }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
              </button>
              {project.folders.map(folder => (
                <div key={folder.id}>
                  <button
                    onClick={handleNavigateToCanvas}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '22px', paddingRight: '10px', paddingTop: '5px', paddingBottom: '5px', borderRadius: '6px', fontSize: '13px', color: '#57534e', background: folder.active ? '#f5f5f4' : 'none', fontWeight: folder.active ? 500 : 400, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', overflow: 'hidden' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: '#a8a29e' }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                  </button>
                  {folder.children && folder.children.map((child: { id: string; name: string }) => (
                    <button
                      key={child.id}
                      onClick={handleNavigateToCanvas}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '36px', paddingRight: '10px', paddingTop: '5px', paddingBottom: '5px', borderRadius: '6px', fontSize: '13px', color: '#57534e', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', overflow: 'hidden' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: '#a8a29e' }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Plan Usage */}
        <div style={{ padding: '12px', borderTop: '1px solid #e7e5e4', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#57534e', flex: 1 }}>Plan usage</span>
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#3b82f6' }}>Free</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#a8a29e', display: 'flex', alignItems: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
            </button>
          </div>
          <button
            style={{ width: '100%', background: '#57534e', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginBottom: '10px' }}
          >
            Upgrade
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Feedback', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
              { label: 'Support', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> },
            ].map(item => (
              <button key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 8px', borderRadius: '6px', fontSize: '12px', color: '#a8a29e', cursor: 'pointer', background: 'none', border: 'none' }}>
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fafaf9' }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '48px', borderBottom: '1px solid #e7e5e4', flexShrink: 0, background: '#fafaf9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#57534e' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#a8a29e' }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <span>journal club 1: tolman machi...</span>
            <span style={{ color: '#a8a29e' }}>/</span>
            <span>Untitled</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #e7e5e4', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 500, color: '#57534e', cursor: 'pointer' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              Upgrade
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', color: '#a8a29e' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '44px', borderBottom: '1px solid #e7e5e4', flexShrink: 0, background: '#fafaf9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {[
              {
                label: 'Display',
                badge: 'Table',
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#a8a29e' }}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
              },
              {
                label: 'Sort',
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#a8a29e' }}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
              },
              {
                label: 'Filter',
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#a8a29e' }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
              },
            ].map(item => (
              <button key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', color: '#57534e', background: 'none', border: 'none', cursor: 'pointer' }}>
                {item.icon}
                {item.label}
                {'badge' in item && item.badge && <span style={{ fontSize: '11px', color: '#a8a29e' }}>{item.badge}</span>}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#a8a29e' }}>0 files in folder</span>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Skeleton rows */}
          <div style={{ position: 'absolute', inset: 0, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'none', userSelect: 'none' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '24px', height: '20px' }}>
                <div style={{ height: '12px', width: '220px', background: '#e7e5e4', borderRadius: '4px', opacity: 0.5, flexShrink: 0 }} />
                <div style={{ height: '12px', width: '120px', background: '#e7e5e4', borderRadius: '4px', opacity: 0.5, flexShrink: 0 }} />
                <div style={{ height: '12px', width: '80px', background: '#e7e5e4', borderRadius: '4px', opacity: 0.5, flexShrink: 0 }} />
                <div style={{ height: '12px', width: '120px', background: '#e7e5e4', borderRadius: '4px', opacity: 0.5, flexShrink: 0 }} />
                <div style={{ height: '12px', width: '80px', background: '#e7e5e4', borderRadius: '4px', opacity: 0.5, flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {/* Empty State */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <div style={{ color: '#57534e', marginBottom: '8px', opacity: 0.8 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#57534e', margin: 0 }}>This folder is empty</p>
            <p style={{ fontSize: '13px', color: '#a8a29e', margin: '0 0 16px' }}>Start chat or add files</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {[
                {
                  label: 'Upload',
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
                },
                {
                  label: 'Import',
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
                },
                {
                  label: 'Create note',
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
                },
                {
                  label: 'Select files',
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
                },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={handleNavigateToCanvas}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#57534e', background: '#fff', border: '1px solid #e7e5e4', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <span style={{ color: '#a8a29e' }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
