import { useState } from 'react';
import './OnboardingScreen.css';

export default function OnboardingScreen({ onImportChoice }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    console.log('Files dropped:', files);
    // TODO: Process files and organize by similarity
    if (onImportChoice) {
      onImportChoice('files', Array.from(files));
    }
  };

  const handleGoogleDrive = () => {
    console.log('Google Drive selected');
    if (onImportChoice) {
      onImportChoice('google-drive');
    }
  };

  const handleExaSearch = () => {
    console.log('Exa Search selected');
    if (onImportChoice) {
      onImportChoice('exa-search');
    }
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-content">
        {/* Header */}
        <div className="onboarding-header">
          <h1>Welcome to Journal</h1>
          <p>Your AI-powered workspace for investigative journalism</p>
        </div>

        {/* Import Options */}
        <div className="import-options">
          {/* Option 1: Drop Files */}
          <div
            className={`import-option ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleChange}
              className="file-input"
              accept=".pdf,.doc,.docx,.txt,.md"
            />
            <label htmlFor="file-upload" className="import-option-inner">
              <div className="import-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h3>Import Documents</h3>
              <p>Drop files here or click to browse</p>
              <span className="import-subtext">PDF, DOC, DOCX, TXT, MD</span>
              <span className="import-subtext">Files will be organized by similarity</span>
            </label>
          </div>

          {/* Divider */}
          <div className="divider">
            <span>OR</span>
          </div>

          {/* Option 2: Google Drive */}
          <button className="import-option" onClick={handleGoogleDrive}>
            <div className="import-option-inner">
              <div className="import-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3>Link Google Drive</h3>
              <p>Connect your Google Drive folder</p>
              <span className="import-subtext">Coming soon</span>
            </div>
          </button>

          {/* Divider */}
          <div className="divider">
            <span>OR</span>
          </div>

          {/* Option 3: Search with Exa */}
          <button className="import-option primary" onClick={handleExaSearch}>
            <div className="import-option-inner">
              <div className="import-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
              </div>
              <h3>Search for Sources</h3>
              <p>Find articles using neural search</p>
              <span className="import-subtext">Powered by Exa AI</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="onboarding-footer">
          <p>You can always import more sources later from the sidebar</p>
        </div>
      </div>
    </div>
  );
}
