'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ForceGraphProps, NodeObject, LinkObject } from 'react-force-graph-2d';

interface GraphNodeData {
  name: string;
  type: 'entity' | 'event' | 'note';
}

interface GraphLinkData {
  label?: string;
}

type GraphNode = NodeObject<GraphNodeData>;
type GraphLink = LinkObject<GraphNodeData, GraphLinkData>;

type TypedForceGraphProps = ForceGraphProps<GraphNode, GraphLink>;

const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d').then(m => m.default as React.ComponentType<TypedForceGraphProps>),
  { ssr: false }
);

interface Project {
  id: string;
  name: string;
  nodes: GraphNode[];
  links: GraphLink[];
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'hanoi-trains',
    name: 'Hanoi trains',
    nodes: [
      { id: 'central', name: 'Hanoi Railway System', type: 'entity' },
      { id: 'viet-railways', name: 'Vietnam Railways', type: 'entity' },
      { id: 'metro-line3', name: 'Metro Line 3', type: 'event' },
      { id: 'hanoi-city', name: 'Hanoi City Gov', type: 'entity' },
      { id: 'infra-fund', name: 'Infrastructure Fund 2024', type: 'entity' },
      { id: 'urban-disp', name: 'Urban Displacement', type: 'note' },
    ],
    links: [
      { source: 'central', target: 'viet-railways', label: 'operated by' },
      { source: 'central', target: 'metro-line3', label: 'includes' },
      { source: 'central', target: 'hanoi-city', label: 'overseen by' },
      { source: 'central', target: 'infra-fund', label: 'funded by' },
      { source: 'metro-line3', target: 'urban-disp', label: 'causes' },
    ],
  },
  {
    id: 'trump-budget',
    name: "Trump's budget cuts",
    nodes: [],
    links: [],
  },
  {
    id: 'i-love-trains',
    name: 'I love trains',
    nodes: [],
    links: [],
  },
];

const NODE_COLORS: Record<string, string> = {
  entity: '#6366f1',
  event: '#ef4444',
  note: '#f59e0b',
};

type ToolMode = 'none' | 'add-node' | 'add-edge';

export default function GraphWorkspacePage() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState('hanoi-trains');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>('none');
  const [showAddNodeForm, setShowAddNodeForm] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<'entity' | 'event' | 'note'>('entity');
  const [edgeFirstNode, setEdgeFirstNode] = useState<GraphNode | null>(null);
  const [showEdgeLabelPrompt, setShowEdgeLabelPrompt] = useState(false);
  const [edgeLabelInput, setEdgeLabelInput] = useState('');
  const [edgeSecondNode, setEdgeSecondNode] = useState<GraphNode | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId)!;

  useEffect(() => {
    const updateDimensions = () => {
      if (graphContainerRef.current) {
        const rect = graphContainerRef.current.getBoundingClientRect();
        setGraphDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    if (graphContainerRef.current) ro.observe(graphContainerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setEdgeFirstNode(null);
    setEdgeSecondNode(null);
    setEdgeLabelInput('');
    setShowEdgeLabelPrompt(false);
    setToolMode(prev => (prev === 'add-edge' ? 'none' : prev));
  }, [activeProjectId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const updateProject = (projectId: string, updater: (p: Project) => Project) => {
    setProjects(prev => prev.map(p => p.id === projectId ? updater(p) : p));
  };

  const handleAddNewProject = () => {
    const id = `proj-${Date.now()}`;
    setProjects(prev => [...prev, { id, name: 'New Project', nodes: [], links: [] }]);
    setActiveProjectId(id);
  };

  const handleAddNode = () => {
    if (!newNodeName.trim()) return;
    const newNode: GraphNode = {
      id: `node-${Date.now()}`,
      name: newNodeName.trim(),
      type: newNodeType,
    };
    updateProject(activeProjectId, p => ({ ...p, nodes: [...p.nodes, newNode] }));
    setNewNodeName('');
    setNewNodeType('entity');
    setShowAddNodeForm(false);
    setToolMode('none');
    showToast(`Node "${newNode.name}" added`);
  };

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (toolMode === 'add-edge') {
      if (!edgeFirstNode) {
        setEdgeFirstNode(node);
        showToast(`Selected "${node.name}" — now click a second node`);
      } else if (edgeFirstNode.id !== node.id) {
        setEdgeSecondNode(node);
        setShowEdgeLabelPrompt(true);
      }
    }
  }, [toolMode, edgeFirstNode]);

  const handleConfirmEdge = () => {
    if (!edgeFirstNode || !edgeSecondNode) return;
    const label = edgeLabelInput.trim() || 'related to';
    updateProject(activeProjectId, p => ({
      ...p,
      links: [...p.links, { source: edgeFirstNode.id, target: edgeSecondNode.id, label }],
    }));
    showToast(`Connected "${edgeFirstNode.name}" → "${edgeSecondNode.name}"`);
    setEdgeFirstNode(null);
    setEdgeSecondNode(null);
    setEdgeLabelInput('');
    setShowEdgeLabelPrompt(false);
    setToolMode('none');
  };

  const cancelEdge = () => {
    setEdgeFirstNode(null);
    setEdgeSecondNode(null);
    setEdgeLabelInput('');
    setShowEdgeLabelPrompt(false);
    setToolMode('none');
  };

  const getNodeColor = (node: GraphNode): string => NODE_COLORS[node.type] ?? '#6b7280';

  const nodeCanvasObject = (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number): void => {
    const radius = 9;
    const nx = node.x ?? 0;
    const ny = node.y ?? 0;
    const isSelected = edgeFirstNode?.id === node.id;

    ctx.beginPath();
    ctx.arc(nx, ny, radius, 0, 2 * Math.PI);
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }

    const label = node.name ?? '';
    const fontSize = Math.max(9, 11 / globalScale);
    ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const textWidth = ctx.measureText(label).width;
    const padding = 3 / globalScale;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.roundRect(
      nx - textWidth / 2 - padding,
      ny + radius + 3 / globalScale,
      textWidth + padding * 2,
      fontSize + padding * 2,
      2 / globalScale
    );
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.fillText(label, nx, ny + radius + 3 / globalScale + padding);
  };

  const resolveNodeCoords = (endpoint: string | number | GraphNode | undefined): { x: number; y: number } | null => {
    if (!endpoint) return null;
    if (typeof endpoint === 'object') return { x: endpoint.x ?? 0, y: endpoint.y ?? 0 };
    const found = activeProject.nodes.find(n => n.id === endpoint);
    return found ? { x: found.x ?? 0, y: found.y ?? 0 } : null;
  };

  const linkCanvasObject = (link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number): void => {
    const source = resolveNodeCoords(link.source);
    const target = resolveNodeCoords(link.target);
    if (!source || !target) return;

    const { x: sx, y: sy } = source;
    const { x: tx, y: ty } = target;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    if (link.label && globalScale > 0.6) {
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      const fontSize = Math.max(7, 9 / globalScale);
      ctx.font = `${fontSize}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(link.label).width;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(mx - tw / 2 - 2 / globalScale, my - fontSize / 2 - 1 / globalScale, tw + 4 / globalScale, fontSize + 2 / globalScale);
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(link.label, mx, my);
    }
  };

  const graphData = { nodes: activeProject.nodes, links: activeProject.links };

  const PLACEHOLDER_SOURCES = [
    { id: 's1', title: 'Vietnam Railway Infrastructure Overview', summary: 'Railway development plans in Vietnam through 2030.', url: 'vnrailways.gov.vn/overview-2024' },
    { id: 's2', title: 'Hanoi Metro Line 3 Environmental Report', summary: 'Environmental and social impact for the new metro line.', url: 'hanoienv.org/metro3-report' },
    { id: 's3', title: 'Infrastructure Fund 2024 Allocation', summary: 'Official budget allocation for transport infrastructure.', url: 'mof.gov.vn/infra-fund-2024' },
  ];

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gray-50 flex z-50">

      {/* ── Floating Top Bar ── */}
      <div className="absolute top-3 left-0 right-0 flex items-center justify-between px-3 pointer-events-none z-20">

        {/* Left: sidebar toggle + breadcrumb */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="h-8 w-8 flex items-center justify-center bg-white rounded-lg shadow border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-2.5 gap-1.5 text-xs text-gray-600">
            <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-2.5 h-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" strokeWidth={2} />
                <path strokeWidth={2} d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </div>
            <span className="font-medium">danica&apos;s space</span>
            <span className="text-gray-300">/</span>
            <span className="font-medium">{activeProject.name}</span>
          </div>
        </div>

        {/* Center: stats */}
        <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-3 gap-4 text-[11px] font-mono text-gray-500 pointer-events-auto">
          <span>{activeProject.nodes.length} nodes</span>
          <span className="text-gray-200">|</span>
          <span>{activeProject.links.length} edges</span>
          <span className="text-gray-200">|</span>
          <span>Z {Math.round(scale * 100)}%</span>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 h-8 px-1 gap-0.5 pointer-events-auto">
          <button
            onClick={() => setSourcesOpen(o => !o)}
            className={`h-6 px-2 flex items-center gap-1 rounded text-[11px] font-medium transition-colors ${sourcesOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Library
          </button>
          <button
            onClick={() => setSourcesOpen(o => !o)}
            className={`h-6 px-2 flex items-center gap-1 rounded text-[11px] font-medium transition-colors ${sourcesOpen ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Sources
          </button>
        </div>
      </div>

      {/* ── Left Sidebar ── */}
      <div
        className="h-full flex-shrink-0 overflow-hidden transition-all duration-300"
        style={{ width: sidebarOpen ? '192px' : '0px' }}
      >
        <div className="w-48 h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-3 pt-14 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">D</div>
              <span className="text-[13px] font-medium text-gray-800 truncate">danica&apos;s space</span>
            </div>
          </div>

          {/* Projects label */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Projects
            </div>
          </div>

          {/* Project list */}
          <div className="flex-1 overflow-y-auto px-1.5 py-1">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setActiveProjectId(project.id)}
                className={`w-full flex items-center gap-2 px-2 py-[5px] rounded-md text-[13px] transition-colors text-left ${
                  project.id === activeProjectId
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth={2} />
                  <path strokeWidth={2} d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                </svg>
                <span className="truncate">{project.name}</span>
              </button>
            ))}
          </div>

          {/* New project */}
          <div className="px-1.5 pb-3 pt-1 border-t border-gray-100">
            <button
              onClick={handleAddNewProject}
              className="w-full flex items-center gap-2 px-2 py-[5px] rounded-md text-[12px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-left border border-dashed border-gray-200"
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
              </svg>
              New project
            </button>
          </div>
        </div>
      </div>

      {/* ── Graph Center Area ── */}
      <div
        ref={graphContainerRef}
        className="relative flex-1 h-full overflow-hidden"
        style={{ cursor: toolMode === 'add-edge' ? 'crosshair' : 'default' }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Graph */}
        {activeProject.nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
              <path strokeWidth={1.5} d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
            </svg>
            <p className="text-sm font-medium text-gray-500">Empty story map</p>
            <p className="text-xs text-gray-400">Use &ldquo;Add node&rdquo; to begin</p>
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            width={graphDimensions.width}
            height={graphDimensions.height}
            nodeId="id"
            nodeLabel="name"
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            linkCanvasObject={linkCanvasObject}
            linkCanvasObjectMode={() => 'replace'}
            onNodeClick={handleNodeClick}
            backgroundColor="transparent"
            cooldownTicks={80}
            onZoom={({ k }) => setScale(k)}
          />
        )}

        {/* ── Floating Tool Panel (bottom-left) ── */}
        <div className="absolute bottom-6 left-4 flex flex-col gap-2" style={{ zIndex: 10 }}>
          {/* Tool buttons */}
          <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => { setToolMode('add-node'); setShowAddNodeForm(true); }}
              className={`flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors border-b border-gray-100 ${toolMode === 'add-node' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8M8 12h8" />
              </svg>
              Add node
            </button>
            <button
              onClick={() => {
                if (toolMode === 'add-edge') { setToolMode('none'); setEdgeFirstNode(null); }
                else { setToolMode('add-edge'); showToast('Click the first node to start an edge'); }
              }}
              className={`flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors border-b border-gray-100 ${toolMode === 'add-edge' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Add edge
              {edgeFirstNode && <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-600 px-1 rounded">1 selected</span>}
            </button>
            <button
              onClick={() => setShowSuggestModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Suggest connections
            </button>
          </div>

          {/* Zoom indicator */}
          <div className="flex items-center bg-white rounded-lg shadow border border-gray-200 px-3 py-1.5 self-start">
            <span className="text-xs text-gray-400 font-mono">scroll to zoom</span>
          </div>
        </div>

        {/* Legend (bottom-right) */}
        <div className="absolute bottom-6 right-4 flex items-center gap-3 bg-white rounded-lg shadow border border-gray-200 px-3 py-2" style={{ zIndex: 10 }}>
          {[{ type: 'entity', label: 'Entity', color: '#6366f1' }, { type: 'event', label: 'Event', color: '#ef4444' }, { type: 'note', label: 'Note', color: '#f59e0b' }].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>

        {/* Add Node inline form */}
        {showAddNodeForm && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-2" style={{ zIndex: 15 }}>
            <input
              autoFocus
              type="text"
              value={newNodeName}
              onChange={e => setNewNodeName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNode(); if (e.key === 'Escape') { setShowAddNodeForm(false); setToolMode('none'); } }}
              placeholder="Node name…"
              className="w-44 text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50"
            />
            <select
              value={newNodeType}
              onChange={e => setNewNodeType(e.target.value as 'entity' | 'event' | 'note')}
              className="text-sm px-2.5 py-1.5 rounded-lg border border-gray-200 outline-none bg-gray-50 cursor-pointer"
            >
              <option value="entity">Entity</option>
              <option value="event">Event</option>
              <option value="note">Note</option>
            </select>
            <button
              onClick={handleAddNode}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => { setShowAddNodeForm(false); setToolMode('none'); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Right Sources Panel ── */}
      <div
        className="h-full flex-shrink-0 overflow-hidden transition-all duration-300"
        style={{ width: sourcesOpen ? '260px' : '0px', animation: sourcesOpen ? 'slide-in-right 0.2s ease-out' : undefined }}
      >
        <div className="w-[260px] h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-14 pb-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Sources</span>
            <button onClick={() => setSourcesOpen(false)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={2} /><path strokeWidth={2} d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search sources…"
                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center mb-3">
              <svg className="w-5 h-5 text-gray-300 mx-auto mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p className="text-[11px] font-medium text-gray-500 mb-0.5">Search results will appear here</p>
              <p className="text-[10px] text-gray-400">Perplexity integration coming soon</p>
            </div>

            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggested</p>
            <div className="flex flex-col gap-2">
              {PLACEHOLDER_SOURCES.map(src => (
                <div key={src.id} className="rounded-lg border border-gray-100 bg-white p-3 opacity-60">
                  <p className="text-[12px] font-medium text-gray-700 mb-1 leading-snug">{src.title}</p>
                  <p className="text-[11px] text-gray-400 leading-snug mb-1.5">{src.summary}</p>
                  <p className="text-[10px] text-gray-300 truncate">{src.url}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Edge Label Modal ── */}
      {showEdgeLabelPrompt && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50" onClick={cancelEdge}>
          <div className="bg-white rounded-2xl shadow-xl p-5 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Relationship label</h3>
            <p className="text-xs text-gray-400 mb-3">
              <span className="font-medium text-indigo-600">{edgeFirstNode?.name}</span>
              {' → '}
              <span className="font-medium text-indigo-600">{edgeSecondNode?.name}</span>
            </p>
            <input
              autoFocus
              type="text"
              value={edgeLabelInput}
              onChange={e => setEdgeLabelInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmEdge(); if (e.key === 'Escape') cancelEdge(); }}
              placeholder="e.g. funded by, caused, involves…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-indigo-400 mb-3 bg-gray-50"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={cancelEdge} className="px-3 py-1.5 rounded-lg text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleConfirmEdge} className="px-3 py-1.5 rounded-lg text-sm text-white bg-gray-800 hover:bg-gray-700 transition-colors font-medium">Connect</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Suggest Connections Modal ── */}
      {showSuggestModal && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50" onClick={() => setShowSuggestModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 w-96" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Suggested connections</h3>
              <button onClick={() => setShowSuggestModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">AI-powered suggestions — preview of upcoming Perplexity integration:</p>
            <div className="flex flex-col gap-2 mb-3">
              {[
                { from: 'Vietnam Railways', to: 'Infrastructure Fund 2024', label: 'receives funding from', reason: 'Both appear in state budget documents' },
                { from: 'Metro Line 3', to: 'Hanoi City Gov', label: 'approved by', reason: 'Urban transit requires municipal approval' },
                { from: 'Urban Displacement', to: 'Hanoi City Gov', label: 'reported to', reason: 'Displacement reports go to local authorities' },
              ].map((s, i) => (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-[12px] font-medium text-gray-700 mb-0.5">
                    <span className="text-indigo-600">{s.from}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span className="text-indigo-600">{s.to}</span>
                  </p>
                  <p className="text-[11px] text-gray-500 italic mb-1">{s.label}</p>
                  <p className="text-[11px] text-gray-400">{s.reason}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[11px] text-amber-700">
              Perplexity integration coming soon — suggestions will be based on your sources.
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[13px] font-medium px-4 py-2 rounded-lg shadow-xl z-50 whitespace-nowrap">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
