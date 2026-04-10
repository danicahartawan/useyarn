'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bot, Search, Type, Database, Code2, LogIn, LogOut, X,
} from 'lucide-react';

const NODE_RADIUS = 36;

const NODE_TYPES = [
  { type: 'agent',     label: 'Agent',      icon: Bot,      color: '#6366f1', bg: '#eef2ff', border: '#818cf8' },
  { type: 'search',    label: 'Web Search', icon: Search,   color: '#0ea5e9', bg: '#e0f2fe', border: '#38bdf8' },
  { type: 'text',      label: 'Text',       icon: Type,     color: '#8b5cf6', bg: '#f5f3ff', border: '#a78bfa' },
  { type: 'data',      label: 'Data',       icon: Database, color: '#f59e0b', bg: '#fffbeb', border: '#fbbf24' },
  { type: 'python',    label: 'Python',     icon: Code2,    color: '#10b981', bg: '#ecfdf5', border: '#34d399' },
  { type: 'input',     label: 'Input',      icon: LogIn,    color: '#64748b', bg: '#f1f5f9', border: '#94a3b8' },
  { type: 'output',    label: 'Output',     icon: LogOut,   color: '#ef4444', bg: '#fef2f2', border: '#f87171' },
] as const;

type NodeType = typeof NODE_TYPES[number]['type'];

const NODE_DESCRIPTIONS: Record<NodeType, string> = {
  agent:  'An AI agent that can reason and act.',
  search: 'Queries the web and retrieves results.',
  text:   'A static or dynamic text block.',
  data:   'Loads or stores structured data.',
  python: 'Runs a Python snippet.',
  input:  'Entry point for pipeline data.',
  output: 'Final output of the pipeline.',
};

const DEFAULT_EDGE_LABELS: Record<NodeType, string> = {
  agent:  'passes to',
  search: 'returns',
  text:   'feeds',
  data:   'provides',
  python: 'outputs',
  input:  'sends',
  output: 'receives',
};

interface AgentNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  x: number;
  y: number;
}

interface AgentEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

function getTypeConfig(type: NodeType) {
  return NODE_TYPES.find(n => n.type === type)!;
}

let nodeCounter = 0;
function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${++nodeCounter}`;
}

interface PopoverInfo {
  node: AgentNode;
  screenX: number;
  screenY: number;
}

interface DrawingEdge {
  fromId: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

const INITIAL_NODES: AgentNode[] = [
  { id: 'n-init-1', type: 'input',  label: 'Input',      description: NODE_DESCRIPTIONS.input,  x: 160,  y: 220 },
  { id: 'n-init-2', type: 'agent',  label: 'Agent',      description: NODE_DESCRIPTIONS.agent,  x: 360,  y: 160 },
  { id: 'n-init-3', type: 'search', label: 'Web Search', description: NODE_DESCRIPTIONS.search, x: 360,  y: 300 },
  { id: 'n-init-4', type: 'output', label: 'Output',     description: NODE_DESCRIPTIONS.output, x: 560,  y: 220 },
];

const INITIAL_EDGES: AgentEdge[] = [
  { id: 'e-init-1', from: 'n-init-1', to: 'n-init-2', label: 'sends' },
  { id: 'e-init-2', from: 'n-init-1', to: 'n-init-3', label: 'sends' },
  { id: 'e-init-3', from: 'n-init-2', to: 'n-init-4', label: 'passes to' },
  { id: 'e-init-4', from: 'n-init-3', to: 'n-init-4', label: 'returns' },
];

export default function AgentCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes] = useState<AgentNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<AgentEdge[]>(INITIAL_EDGES);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const [addMode, setAddMode] = useState<NodeType | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mx: number; my: number; nx: number; ny: number } | null>(null);

  const [panningCanvas, setPanningCanvas] = useState(false);
  const panStartRef = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const [drawingEdge, setDrawingEdge] = useState<DrawingEdge | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [popover, setPopover] = useState<PopoverInfo | null>(null);
  const popoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInsidePopoverRef = useRef(false);

  const screenToCanvas = useCallback((sx: number, sy: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { cx: 0, cy: 0 };
    const cx = (sx - rect.left - pan.x) / zoom;
    const cy = (sy - rect.top - pan.y) / zoom;
    return { cx, cy };
  }, [pan, zoom]);

  const nodeAt = useCallback((cx: number, cy: number) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = cx - n.x;
      const dy = cy - n.y;
      if (Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS) return n;
    }
    return null;
  }, [nodes]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.min(3, Math.max(0.2, zoom * (1 + delta)));
    const zoomRatio = newZoom / zoom;
    setPan(p => ({
      x: mouseX - zoomRatio * (mouseX - p.x),
      y: mouseY - zoomRatio * (mouseY - p.y),
    }));
    setZoom(newZoom);
  }, [zoom]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const { cx, cy } = screenToCanvas(e.clientX, e.clientY);
    const hit = nodeAt(cx, cy);
    if (hit) {
      if (addMode) return;
      setDraggingNodeId(hit.id);
      dragStartRef.current = { mx: e.clientX, my: e.clientY, nx: hit.x, ny: hit.y };
      setPopover(null);
      return;
    }
    if (addMode) return;
    setPanningCanvas(true);
    panStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }, [screenToCanvas, nodeAt, addMode, pan]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId && dragStartRef.current) {
      const dx = (e.clientX - dragStartRef.current.mx) / zoom;
      const dy = (e.clientY - dragStartRef.current.my) / zoom;
      setNodes(prev => prev.map(n => n.id === draggingNodeId
        ? { ...n, x: dragStartRef.current!.nx + dx, y: dragStartRef.current!.ny + dy }
        : n
      ));
      return;
    }
    if (panningCanvas && panStartRef.current) {
      setPan({
        x: panStartRef.current.px + (e.clientX - panStartRef.current.mx),
        y: panStartRef.current.py + (e.clientY - panStartRef.current.my),
      });
      return;
    }
    if (drawingEdge) {
      const { cx, cy } = screenToCanvas(e.clientX, e.clientY);
      setDrawingEdge(prev => prev ? { ...prev, x2: cx, y2: cy } : null);
    }
  }, [draggingNodeId, panningCanvas, drawingEdge, zoom, screenToCanvas]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      dragStartRef.current = null;
      return;
    }
    if (panningCanvas) {
      setPanningCanvas(false);
      panStartRef.current = null;
      return;
    }
    if (drawingEdge) {
      const { cx, cy } = screenToCanvas(e.clientX, e.clientY);
      const target = nodeAt(cx, cy);
      if (target && target.id !== drawingEdge.fromId) {
        const fromNode = nodes.find(n => n.id === drawingEdge.fromId)!;
        const label = DEFAULT_EDGE_LABELS[fromNode.type] || 'connects';
        setEdges(prev => [...prev, { id: uniqueId('e'), from: drawingEdge.fromId, to: target.id, label }]);
      }
      setDrawingEdge(null);
      return;
    }
    if (addMode) {
      const { cx, cy } = screenToCanvas(e.clientX, e.clientY);
      const conf = getTypeConfig(addMode);
      setNodes(prev => [...prev, {
        id: uniqueId('n'),
        type: addMode,
        label: conf.label,
        description: NODE_DESCRIPTIONS[addMode],
        x: cx,
        y: cy,
      }]);
      setAddMode(null);
    }
  }, [draggingNodeId, panningCanvas, drawingEdge, addMode, screenToCanvas, nodeAt, nodes]);

  const dismissPopover = useCallback(() => {
    if (popoverHideTimerRef.current) clearTimeout(popoverHideTimerRef.current);
    popoverHideTimerRef.current = setTimeout(() => {
      if (!isInsidePopoverRef.current) {
        setPopover(null);
        setHoveredNodeId(null);
      }
    }, 120);
  }, []);

  const handleNodeHover = useCallback((nodeId: string, enter: boolean, e: React.MouseEvent) => {
    if (draggingNodeId) return;
    if (enter) {
      if (popoverHideTimerRef.current) clearTimeout(popoverHideTimerRef.current);
      setHoveredNodeId(nodeId);
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
      popoverTimerRef.current = setTimeout(() => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          setPopover({ node, screenX: e.clientX, screenY: e.clientY });
        }
      }, 500);
    } else {
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
      setHoveredNodeId(null);
      dismissPopover();
    }
  }, [draggingNodeId, nodes, dismissPopover]);

  const startDrawingEdge = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId)!;
    setDrawingEdge({ fromId: nodeId, x1: node.x, y1: node.y, x2: node.x, y2: node.y });
    setPopover(null);
  }, [nodes]);

  useEffect(() => {
    return () => {
      if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
      if (popoverHideTimerRef.current) clearTimeout(popoverHideTimerRef.current);
    };
  }, []);

  const nodeConnections = useCallback((nodeId: string) => {
    const incoming = edges
      .filter(e => e.to === nodeId)
      .map(e => ({ dir: 'from' as const, edge: e, other: nodes.find(n => n.id === e.from) }));
    const outgoing = edges
      .filter(e => e.from === nodeId)
      .map(e => ({ dir: 'to' as const, edge: e, other: nodes.find(n => n.id === e.to) }));
    return { incoming, outgoing };
  }, [edges, nodes]);

  const getCurvedPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx1 = x1 + dx * 0.5;
    const cy1 = y1;
    const cx2 = x1 + dx * 0.5;
    const cy2 = y2;
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  const getEdgeEndpoints = useCallback((edge: AgentEdge) => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (!from || !to) return null;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x1: from.x + (dx / dist) * NODE_RADIUS,
      y1: from.y + (dy / dist) * NODE_RADIUS,
      x2: to.x - (dx / dist) * NODE_RADIUS,
      y2: to.y - (dy / dist) * NODE_RADIUS,
    };
  }, [nodes]);

  const dotSpacing = 24;

  const cursor = addMode ? 'crosshair' : (panningCanvas ? 'grabbing' : (draggingNodeId ? 'grabbing' : 'grab'));

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50 select-none" style={{ cursor }}>

      {/* Infinite dot-grid canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={() => {
          setPanningCanvas(false);
          setDraggingNodeId(null);
          if (drawingEdge) setDrawingEdge(null);
        }}
      >
        {/* Dot grid background */}
        <svg
          className="absolute"
          style={{
            left: ((pan.x % (dotSpacing * zoom)) - dotSpacing * zoom),
            top: ((pan.y % (dotSpacing * zoom)) - dotSpacing * zoom),
            width: `calc(100% + ${dotSpacing * zoom * 2}px)`,
            height: `calc(100% + ${dotSpacing * zoom * 2}px)`,
            pointerEvents: 'none',
          }}
        >
          <defs>
            <pattern id="dot-pattern" x="0" y="0" width={dotSpacing * zoom} height={dotSpacing * zoom} patternUnits="userSpaceOnUse">
              <circle cx={dotSpacing * zoom / 2} cy={dotSpacing * zoom / 2} r={Math.min(1.5, zoom * 1.2)} fill="#d1d5db" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>

        {/* Canvas SVG for edges */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
            <marker id="arrowhead-drawing" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Rendered edges */}
            {edges.map(edge => {
              const ep = getEdgeEndpoints(edge);
              if (!ep) return null;
              const { x1, y1, x2, y2 } = ep;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              const path = getCurvedPath(x1, y1, x2, y2);
              return (
                <g key={edge.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth={1.5 / zoom}
                    markerEnd="url(#arrowhead)"
                  />
                  {zoom > 0.4 && (
                    <>
                      <rect
                        x={mx - 22 / zoom}
                        y={my - 8 / zoom}
                        width={44 / zoom}
                        height={16 / zoom}
                        rx={4 / zoom}
                        fill="white"
                        stroke="#e2e8f0"
                        strokeWidth={0.5 / zoom}
                      />
                      <text
                        x={mx}
                        y={my + 1 / zoom}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={9 / zoom}
                        fill="#94a3b8"
                        style={{ fontFamily: 'system-ui, sans-serif' }}
                      >
                        {edge.label}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Drawing edge (live preview) */}
            {drawingEdge && (
              <path
                d={getCurvedPath(drawingEdge.x1, drawingEdge.y1, drawingEdge.x2, drawingEdge.y2)}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5 / zoom}
                strokeDasharray={`${4 / zoom} ${3 / zoom}`}
                markerEnd="url(#arrowhead-drawing)"
              />
            )}

            {/* Nodes */}
            {nodes.map(node => {
              const conf = getTypeConfig(node.type);
              const Icon = conf.icon;
              const isHovered = hoveredNodeId === node.id;
              const isDragged = draggingNodeId === node.id;
              const iconSize = Math.round(NODE_RADIUS * 0.55);
              const handleR = 6;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: draggingNodeId ? 'grabbing' : 'grab', pointerEvents: 'all' }}
                  onMouseEnter={e => handleNodeHover(node.id, true, e)}
                  onMouseLeave={e => handleNodeHover(node.id, false, e)}
                >
                  {/* Outer ring on hover/drag */}
                  {(isHovered || isDragged) && (
                    <circle
                      r={NODE_RADIUS + 5}
                      fill="none"
                      stroke={conf.border}
                      strokeWidth={1.5 / zoom}
                      strokeDasharray={`${3 / zoom} ${2 / zoom}`}
                      opacity={0.6}
                    />
                  )}

                  {/* Shadow */}
                  <circle r={NODE_RADIUS + 1} fill="rgba(0,0,0,0.06)" cy={2 / zoom} />

                  {/* Main circle */}
                  <circle
                    r={NODE_RADIUS}
                    fill={conf.bg}
                    stroke={conf.border}
                    strokeWidth={(isHovered || isDragged) ? 2 / zoom : 1.5 / zoom}
                  />

                  {/* Icon (rendered as SVG foreignObject) */}
                  <foreignObject
                    x={-iconSize / 2}
                    y={-iconSize / 2}
                    width={iconSize}
                    height={iconSize}
                    style={{ pointerEvents: 'none', overflow: 'visible' }}
                  >
                    <div
                      style={{
                        width: iconSize,
                        height: iconSize,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: conf.color,
                      }}
                    >
                      <Icon size={iconSize * 0.8} strokeWidth={1.75} />
                    </div>
                  </foreignObject>

                  {/* Label below */}
                  <text
                    y={NODE_RADIUS + 14 / zoom}
                    textAnchor="middle"
                    fontSize={10 / zoom}
                    fill="#374151"
                    fontWeight="500"
                    style={{ fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}
                  >
                    {node.label}
                  </text>

                  {/* Connector handle (visible on hover) */}
                  {isHovered && !drawingEdge && !draggingNodeId && (
                    <g
                      transform={`translate(${NODE_RADIUS + handleR + 2}, 0)`}
                      style={{ cursor: 'crosshair', pointerEvents: 'all' }}
                      onMouseDown={e => { e.stopPropagation(); startDrawingEdge(node.id, e); }}
                    >
                      <circle r={handleR / zoom} fill={conf.color} opacity={0.9} />
                      <line
                        x1={-handleR * 0.5 / zoom}
                        y1={0}
                        x2={handleR * 0.5 / zoom}
                        y2={0}
                        stroke="white"
                        strokeWidth={1.5 / zoom}
                      />
                      <line
                        x1={0}
                        y1={-handleR * 0.5 / zoom}
                        x2={0}
                        y2={handleR * 0.5 / zoom}
                        stroke="white"
                        strokeWidth={1.5 / zoom}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Stats bar (top) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full shadow border border-gray-200 px-4 py-1.5 text-[11px] font-mono text-gray-500 pointer-events-none z-10">
        <span>{nodes.length} nodes</span>
        <span className="text-gray-200">|</span>
        <span>{edges.length} edges</span>
        <span className="text-gray-200">|</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-2xl shadow-lg border border-gray-200 px-3 py-2 z-10">
        {NODE_TYPES.map(conf => {
          const Icon = conf.icon;
          const isActive = addMode === conf.type;
          return (
            <button
              key={conf.type}
              onClick={() => setAddMode(isActive ? null : conf.type)}
              title={conf.label}
              className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
              style={{ minWidth: 48 }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: isActive ? conf.bg : '#f8fafc', color: conf.color }}
              >
                <Icon size={15} strokeWidth={1.75} />
              </div>
              <span style={{ color: isActive ? conf.color : undefined }}>{conf.label}</span>
            </button>
          );
        })}
        {addMode && (
          <button
            onClick={() => setAddMode(null)}
            className="ml-1 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0"
            title="Cancel"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Add mode hint */}
      {addMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full shadow-md pointer-events-none z-10">
          Click anywhere on the canvas to place a <strong>{getTypeConfig(addMode).label}</strong> node
        </div>
      )}

      {/* Popover */}
      {popover && (() => {
        const conf = getTypeConfig(popover.node.type);
        const Icon = conf.icon;
        const { incoming, outgoing } = nodeConnections(popover.node.id);
        const rect = containerRef.current?.getBoundingClientRect();
        const relX = popover.screenX - (rect?.left ?? 0) + 16;
        const relY = popover.screenY - (rect?.top ?? 0) - 10;
        return (
          <div
            className="absolute z-20"
            style={{ left: relX, top: relY, maxWidth: 240 }}
            onMouseEnter={() => {
              isInsidePopoverRef.current = true;
              if (popoverHideTimerRef.current) clearTimeout(popoverHideTimerRef.current);
            }}
            onMouseLeave={() => {
              isInsidePopoverRef.current = false;
              setPopover(null);
              setHoveredNodeId(null);
            }}
          >
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100" style={{ background: conf.bg }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'white', color: conf.color }}>
                    <Icon size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{popover.node.label}</div>
                    <div className="inline-flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: conf.border + '30', color: conf.color }}>
                        {conf.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 py-3 space-y-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">Description</label>
                  <textarea
                    className="w-full text-[11px] text-gray-600 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 resize-none outline-none focus:border-indigo-300 focus:bg-white transition-colors"
                    rows={2}
                    value={popover.node.description}
                    onChange={e => {
                      const newDesc = e.target.value;
                      setNodes(prev => prev.map(n => n.id === popover.node.id ? { ...n, description: newDesc } : n));
                      setPopover(prev => prev ? { ...prev, node: { ...prev.node, description: newDesc } } : null);
                    }}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                  />
                </div>

                {(incoming.length > 0 || outgoing.length > 0) && (
                  <div className="space-y-1.5">
                    <div className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Connections</div>
                    {incoming.map(({ edge, other }) => other && (
                      <div key={edge.id} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="text-gray-400">{edge.label}</span>
                        <span className="font-medium text-gray-600">{other.label}</span>
                      </div>
                    ))}
                    {outgoing.map(({ edge, other }) => other && (
                      <div key={edge.id} className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: conf.color, flexShrink: 0 }} />
                        <span className="text-gray-400">{edge.label}</span>
                        <span className="font-medium text-gray-600">{other.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
