import { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './NodeGraph.css';

export default function NodeGraph() {
  const graphRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphData, setGraphData] = useState({
    nodes: [],
    links: []
  });

  useEffect(() => {
    // Sample data for investigative journalism use case
    const sampleData = {
      nodes: [
        // Central investigation node
        { id: 'investigation', name: 'Healthcare Fraud Investigation', type: 'investigation', size: 20 },

        // Key entities
        { id: 'company-a', name: 'MedCorp LLC', type: 'company', size: 15 },
        { id: 'company-b', name: 'HealthTech Inc', type: 'company', size: 15 },
        { id: 'person-1', name: 'John Smith', type: 'person', size: 12 },
        { id: 'person-2', name: 'Jane Doe', type: 'person', size: 12 },
        { id: 'person-3', name: 'Robert Johnson', type: 'person', size: 10 },

        // Documents
        { id: 'doc-1', name: 'SEC Filing 2024-Q1', type: 'document', size: 10 },
        { id: 'doc-2', name: 'Internal Memo', type: 'document', size: 8 },
        { id: 'doc-3', name: 'Financial Report', type: 'document', size: 10 },
        { id: 'doc-4', name: 'Email Thread', type: 'document', size: 8 },

        // Locations
        { id: 'loc-1', name: 'New York Office', type: 'location', size: 8 },
        { id: 'loc-2', name: 'Delaware', type: 'location', size: 8 },

        // Events
        { id: 'event-1', name: 'Board Meeting 03/2024', type: 'event', size: 10 },
        { id: 'event-2', name: 'Merger Announcement', type: 'event', size: 10 },
      ],
      links: [
        // Investigation connections
        { source: 'investigation', target: 'company-a', label: 'investigating' },
        { source: 'investigation', target: 'company-b', label: 'investigating' },

        // Corporate relationships
        { source: 'person-1', target: 'company-a', label: 'CEO' },
        { source: 'person-2', target: 'company-b', label: 'CFO' },
        { source: 'person-3', target: 'company-a', label: 'Board Member' },
        { source: 'company-a', target: 'company-b', label: 'partnership' },

        // Document connections
        { source: 'person-1', target: 'doc-1', label: 'filed' },
        { source: 'person-2', target: 'doc-3', label: 'signed' },
        { source: 'doc-2', target: 'person-1', label: 'mentions' },
        { source: 'doc-4', target: 'person-2', label: 'sent by' },
        { source: 'doc-4', target: 'person-3', label: 'received by' },

        // Location connections
        { source: 'company-a', target: 'loc-1', label: 'headquartered' },
        { source: 'company-b', target: 'loc-2', label: 'incorporated' },
        { source: 'event-1', target: 'loc-1', label: 'held at' },

        // Event connections
        { source: 'event-1', target: 'person-1', label: 'attended' },
        { source: 'event-1', target: 'person-3', label: 'attended' },
        { source: 'event-2', target: 'company-a', label: 'announced by' },
        { source: 'event-2', target: 'company-b', label: 'involves' },
      ]
    };

    setGraphData(sampleData);

    // Auto-fit graph on mount
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.zoomToFit(400, 100);
      }, 100);
    }
  }, []);

  const getNodeColor = (node) => {
    const colors = {
      investigation: '#3b82f6',
      company: '#f59e0b',
      person: '#10b981',
      document: '#8b5cf6',
      location: '#ec4899',
      event: '#ef4444'
    };
    return colors[node.type] || '#6b7280';
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);

    // Highlight connected nodes
    if (graphRef.current) {
      const connectedNodeIds = new Set();
      graphData.links.forEach(link => {
        if (link.source.id === node.id || link.source === node.id) {
          connectedNodeIds.add(typeof link.target === 'object' ? link.target.id : link.target);
        }
        if (link.target.id === node.id || link.target === node.id) {
          connectedNodeIds.add(typeof link.source === 'object' ? link.source.id : link.source);
        }
      });
    }
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
  };

  const nodeCanvasObject = (node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);

    // Draw node circle
    ctx.fillStyle = getNodeColor(node);
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size / 2, 0, 2 * Math.PI, false);
    ctx.fill();

    // Draw label background (only if zoomed in enough)
    if (globalScale > 1.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2,
        node.y + node.size / 2 + 2,
        bckgDimensions[0],
        bckgDimensions[1]
      );

      // Draw label text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#171717';
      ctx.fillText(label, node.x, node.y + node.size / 2 + 2 + bckgDimensions[1] / 2);
    }
  };

  return (
    <div className="node-graph-container">
      <div className="node-graph-controls">
        <div className="control-group">
          <button
            className="control-btn"
            onClick={() => graphRef.current?.zoomToFit(400, 100)}
            title="Fit to view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            className="control-btn"
            onClick={() => graphRef.current?.centerAt(0, 0, 400)}
            title="Center view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#3b82f6' }}></div>
            <span>Investigation</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
            <span>Company</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#10b981' }}></div>
            <span>Person</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#8b5cf6' }}></div>
            <span>Document</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ec4899' }}></div>
            <span>Location</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#ef4444' }}></div>
            <span>Event</span>
          </div>
        </div>
      </div>

      <div className="graph-wrapper">
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeLabel="name"
          nodeVal="size"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          linkColor={() => '#e5e5e5'}
          linkWidth={2}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          backgroundColor="#ffffff"
          cooldownTicks={100}
          onEngineStop={() => graphRef.current?.zoomToFit(400, 100)}
        />
      </div>

      {selectedNode && (
        <div className="node-details-panel">
          <div className="panel-header">
            <h3>{selectedNode.name}</h3>
            <button className="close-btn" onClick={() => setSelectedNode(null)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="panel-content">
            <div className="detail-item">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{selectedNode.type}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">ID:</span>
              <span className="detail-value">{selectedNode.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Connections:</span>
              <span className="detail-value">
                {graphData.links.filter(link =>
                  (link.source.id === selectedNode.id || link.source === selectedNode.id) ||
                  (link.target.id === selectedNode.id || link.target === selectedNode.id)
                ).length}
              </span>
            </div>
          </div>
          <div className="panel-actions">
            <button className="action-btn">View Details</button>
            <button className="action-btn">Add to Journal</button>
          </div>
        </div>
      )}
    </div>
  );
}
