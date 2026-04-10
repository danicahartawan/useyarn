import { useState } from 'react';
import FileSidebar from './components/FileSidebar';
import FolderBrowserScreen from './components/FolderBrowserScreen';
import NodeGraph from './components/NodeGraph';
import JournalWorkspace from './components/JournalWorkspace';
import './App.css';

export default function App() {
  const [files, setFiles] = useState([]);
  const [currentView, setCurrentView] = useState('folder-browser');
  const [isJournalOpen, setIsJournalOpen] = useState(false);

  const handleNavigateToCanvas = () => {
    window.location.href = '/canvas';
  };

  if (currentView === 'folder-browser') {
    return <FolderBrowserScreen onNavigateToCanvas={handleNavigateToCanvas} />;
  }

  return (
    <div className="app">
      <FileSidebar files={files} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Home</span>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" title="Language settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 8 6 6"/>
                <path d="m4 14 6-6 2-3"/>
                <path d="M2 5h12"/>
                <path d="M7 2h1"/>
                <path d="m22 22-5-10-5 10"/>
                <path d="M14 18h6"/>
              </svg>
            </button>
            <button className="icon-btn" title="More options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
              </svg>
            </button>
            <button
              className={`journal-toggle-btn ${isJournalOpen ? 'active' : ''}`}
              onClick={() => setIsJournalOpen(!isJournalOpen)}
              title={isJournalOpen ? 'Close journal' : 'Open journal'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              Open Journal
            </button>
            <button className="upgrade-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 12 7-7 7 7"/>
                <path d="M12 19V5"/>
              </svg>
              Upgrade
            </button>
          </div>
        </div>

        <div className="content-area">
          {currentView === 'graph' && (
            <NodeGraph />
          )}
        </div>
      </div>

      {isJournalOpen && <JournalWorkspace />}
    </div>
  );
}
