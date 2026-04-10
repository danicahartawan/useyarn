import './FolderBrowserScreen.css';

const PRIVATE_PROJECTS = [
  {
    id: 'proj-1',
    name: 'journal club 1: tolman machine',
    folders: [
      { id: 'f-1', name: 'Untitled' },
      { id: 'f-2', name: 'Untitled', active: true, children: [
        { id: 'f-3', name: 'Untitled' }
      ] }
    ]
  }
];

export default function FolderBrowserScreen({ onNavigateToCanvas }) {
  const handleAction = () => {
    if (onNavigateToCanvas) onNavigateToCanvas();
  };

  return (
    <div className="folder-browser">
      {/* Left Sidebar */}
      <aside className="fb-sidebar">
        {/* Sidebar Header */}
        <div className="fb-sidebar-header">
          <button className="fb-user-btn">
            <span>danicahartawan</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div className="fb-sidebar-actions">
            <button className="fb-icon-btn" title="Search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
            <button className="fb-icon-btn" title="New">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="fb-nav">
          <button className="fb-nav-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </button>
          <button className="fb-nav-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Library
          </button>
          <button className="fb-nav-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
            Agent
          </button>
        </nav>

        {/* Private Section */}
        <div className="fb-section-label">Private</div>
        <div className="fb-project-tree">
          {PRIVATE_PROJECTS.map(project => (
            <div key={project.id} className="fb-project">
              <button className="fb-tree-item fb-project-name" onClick={handleAction}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>{project.name}</span>
              </button>
              {project.folders.map(folder => (
                <div key={folder.id}>
                  <button
                    className={`fb-tree-item fb-tree-folder${folder.active ? ' active' : ''}`}
                    onClick={handleAction}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>{folder.name}</span>
                  </button>
                  {folder.children && folder.children.map(child => (
                    <button
                      key={child.id}
                      className="fb-tree-item fb-tree-child"
                      onClick={handleAction}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span>{child.name}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div className="fb-sidebar-spacer" />

        {/* Plan Usage */}
        <div className="fb-plan-section">
          <div className="fb-plan-row">
            <span className="fb-plan-label">Plan usage</span>
            <span className="fb-plan-badge">Free</span>
            <button className="fb-plan-chevron" aria-label="collapse">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </button>
          </div>
          <button className="fb-upgrade-btn">Upgrade</button>

          <div className="fb-footer-links">
            <button className="fb-footer-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Feedback
            </button>
            <button className="fb-footer-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              Support
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="fb-main">
        {/* Top Bar */}
        <div className="fb-topbar">
          <div className="fb-topbar-left">
            <div className="fb-breadcrumb">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="fb-breadcrumb-segment">journal club 1: tolman machi...</span>
              <span className="fb-breadcrumb-sep">/</span>
              <span className="fb-breadcrumb-segment">Untitled</span>
            </div>
          </div>
          <div className="fb-topbar-right">
            <button className="fb-upgrade-top-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 12 7-7 7 7"/>
                <path d="M12 19V5"/>
              </svg>
              Upgrade
            </button>
            <button className="fb-icon-btn" title="Toggle panel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="fb-toolbar">
          <div className="fb-toolbar-left">
            <button className="fb-toolbar-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Display
              <span className="fb-toolbar-badge">Table</span>
            </button>
            <button className="fb-toolbar-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Sort
            </button>
            <button className="fb-toolbar-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filter
            </button>
          </div>
          <div className="fb-toolbar-right">
            <span className="fb-file-count">0 files in folder</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="fb-content">
          {/* Skeleton rows in background */}
          <div className="fb-skeleton-rows">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="fb-skeleton-row">
                <div className="fb-skeleton-cell fb-skeleton-wide" />
                <div className="fb-skeleton-cell fb-skeleton-medium" />
                <div className="fb-skeleton-cell fb-skeleton-narrow" />
                <div className="fb-skeleton-cell fb-skeleton-medium" />
                <div className="fb-skeleton-cell fb-skeleton-narrow" />
              </div>
            ))}
          </div>

          {/* Empty State Overlay */}
          <div className="fb-empty-state">
            <div className="fb-empty-folder-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="fb-empty-title">This folder is empty</p>
            <p className="fb-empty-subtitle">Start chat or add files</p>

            <div className="fb-action-buttons">
              <button className="fb-action-btn" onClick={handleAction}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload
              </button>
              <button className="fb-action-btn" onClick={handleAction}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Import
              </button>
              <button className="fb-action-btn" onClick={handleAction}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                Create note
              </button>
              <button className="fb-action-btn" onClick={handleAction}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Select files
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
