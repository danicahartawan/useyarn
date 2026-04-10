'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProposals, ProposalTargetType, ResearchSource } from './ProposalContext';
import { createClient } from '@/utils/supabase/client';

interface Task {
  id: string;
  notebook_id: string;
  name: string;
  status: 'active' | 'draft' | 'waiting' | 'queued';
  proposal_target: ProposalTargetType;
  created_at: string;
}

const STATUS_COLORS: Record<Task['status'], string> = {
  active: '#6366f1',
  draft: '#9ca3af',
  waiting: '#f59e0b',
  queued: '#9ca3af',
};

const STATUS_LABELS: Record<Task['status'], string> = {
  active: 'Active',
  draft: 'Draft',
  waiting: 'Waiting',
  queued: 'Queued',
};

const TARGET_LABELS: Record<ProposalTargetType, string> = {
  notebook: 'Notebook',
  'file-tree': 'File Tree',
  canvas: 'Canvas',
};

function SpinnerIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" style={{ color }}>
      <style>{`
        @keyframes nb-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .nb-spin { animation: nb-spin 1.1s linear infinite; transform-origin: center; }
      `}</style>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path className="nb-spin" d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DotIcon({ color }: { color: string }) {
  return (
    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
}

function TaskRow({
  task,
  notebookContent,
  onStatusChange,
}: {
  task: Task;
  notebookContent: string;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}) {
  const isAnimated = task.status === 'active' || task.status === 'waiting';
  const { proposals, proposeEdit } = useProposals();
  const [blocked, setBlocked] = useState(false);
  const [blockTarget, setBlockTarget] = useState<string>('');
  const [isProposing, setIsProposing] = useState(false);
  const [proposeStep, setProposeStep] = useState<'idle' | 'researching' | 'generating'>('idle');
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([]);

  const proposal = proposals[task.proposal_target];
  const isThisTaskProposal = proposal?.taskId === task.id;
  const isPending = isThisTaskProposal && proposal?.status === 'pending';
  const isApplied = isThisTaskProposal && proposal?.status === 'applied';
  const isDismissed = isThisTaskProposal && proposal?.status === 'dismissed';
  const isResolved = isApplied || isDismissed;

  const handlePropose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBlocked(false);
    setIsProposing(true);
    setProposeStep('researching');
    setResearchSources([]);

    let researchContext = '';
    let sources: ResearchSource[] = [];

    try {
      const searchRes = await fetch('/api/perplexity-agent-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: task.name }),
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        researchContext = searchData.answer ?? '';
        sources = searchData.sources ?? [];
        setResearchSources(sources);
      }
    } catch {
      // Research step failed silently — proposal will still be generated without it
    }

    setProposeStep('generating');

    try {
      const res = await fetch('/api/notebook-task-propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName: task.name,
          proposalTarget: task.proposal_target,
          notebookContent,
          researchContext,
          researchSources: sources,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        console.error('Proposal generation failed:', data.error);
        setIsProposing(false);
        setProposeStep('idle');
        return;
      }

      const result = proposeEdit({
        targetType: task.proposal_target,
        taskId: task.id,
        taskName: task.name,
        proposedValue: data.proposal,
        originalValue: '',
        researchSources: sources,
      });

      if (result === 'blocked') {
        setBlocked(true);
        const existing = proposals[task.proposal_target];
        setBlockTarget(existing?.taskName ?? 'another task');
        setTimeout(() => setBlocked(false), 3000);
      }
    } catch (err) {
      console.error('Proposal error:', err);
    } finally {
      setIsProposing(false);
      setProposeStep('idle');
    }
  };

  let rowBg: string | undefined;
  let rowBorder = '2px solid transparent';
  if (isPending) { rowBg = '#fffbeb'; rowBorder = '2px solid #f59e0b'; }
  if (isApplied) { rowBg = '#f0fdf4'; rowBorder = '2px solid #22c55e'; }
  if (isDismissed) { rowBg = '#fafafa'; rowBorder = '2px solid #e5e7eb'; }

  const dotColor = isApplied ? '#22c55e' : isDismissed ? '#d1d5db' : STATUS_COLORS[task.status];

  const timeAgo = (() => {
    const diffMs = Date.now() - new Date(task.created_at).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  })();

  const statusLabel = `${STATUS_LABELS[task.status]} · ${timeAgo}`;

  return (
    <div
      className="group flex items-start gap-2 py-2 transition-colors cursor-pointer"
      style={{
        paddingLeft: '12px',
        paddingRight: '12px',
        background: rowBg,
        borderLeft: rowBorder,
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isAnimated && !isResolved ? (
          <SpinnerIcon color={dotColor} />
        ) : (
          <DotIcon color={dotColor} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className="text-[12px] font-medium leading-tight truncate flex-1 min-w-0"
            style={{
              color: isResolved ? '#9ca3af' : '#1f2937',
              textDecoration: isDismissed ? 'line-through' : undefined,
            }}
          >
            {task.name}
          </p>
          {isPending && (
            <span style={{
              fontSize: '9px', fontWeight: 700, color: '#d97706',
              background: '#fef3c7', border: '1px solid #fde68a',
              borderRadius: '3px', padding: '1px 4px', textTransform: 'uppercase',
              letterSpacing: '0.04em', flexShrink: 0,
            }}>
              Review
            </span>
          )}
          {isApplied && (
            <span style={{
              fontSize: '9px', fontWeight: 700, color: '#16a34a',
              background: '#dcfce7', border: '1px solid #bbf7d0',
              borderRadius: '3px', padding: '1px 4px', textTransform: 'uppercase',
              letterSpacing: '0.04em', flexShrink: 0,
            }}>
              Applied
            </span>
          )}
          {isDismissed && (
            <span style={{
              fontSize: '9px', fontWeight: 700, color: '#9ca3af',
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: '3px', padding: '1px 4px', textTransform: 'uppercase',
              letterSpacing: '0.04em', flexShrink: 0,
            }}>
              Dismissed
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{statusLabel}</p>
        {blocked && (
          <p className="text-[10px] text-amber-600 mt-0.5 leading-tight">
            Resolve pending proposal for &quot;{blockTarget.slice(0, 36)}...&quot; first
          </p>
        )}
        {isPending && (
          <p className="text-[10px] text-amber-600 mt-0.5 font-medium">
            Awaiting review — see preview
          </p>
        )}
        {isPending && researchSources.length > 0 && (
          <div className="mt-1.5">
            <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Research sources</p>
            {researchSources.slice(0, 3).map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[9px] text-blue-500 hover:text-blue-700 truncate"
              >
                <span>↗</span>
                <span className="truncate">{src.title || src.url}</span>
              </a>
            ))}
          </div>
        )}
        {isApplied && (
          <p className="text-[10px] text-green-600 mt-0.5 font-medium">
            Changes applied to main version
          </p>
        )}
        {isDismissed && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            Proposal dismissed
          </p>
        )}
        {!isPending && !isResolved && (
          <button
            onClick={handlePropose}
            disabled={isProposing}
            className="opacity-0 group-hover:opacity-100 mt-1.5 text-[10px] font-medium text-indigo-600 hover:text-indigo-800 transition-all bg-indigo-50 hover:bg-indigo-100 rounded px-2 py-0.5 border border-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProposing
              ? proposeStep === 'researching' ? 'Researching…' : 'Generating…'
              : '+ Propose edit'}
          </button>
        )}
      </div>
    </div>
  );
}

interface TaskBoardProps {
  tasks: Task[];
  onClose: () => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
}

const KANBAN_COLUMNS: Task['status'][] = ['active', 'draft', 'waiting', 'queued'];

const COLUMN_COLORS: Record<Task['status'], string> = {
  active: '#6366f1',
  draft: '#9ca3af',
  waiting: '#f59e0b',
  queued: '#6b7280',
};

function TaskBoard({ tasks, onClose, onStatusChange }: TaskBoardProps) {
  const [dragging, setDragging] = useState<string | null>(null);

  const grouped: Record<Task['status'], Task[]> = {
    active: [],
    draft: [],
    waiting: [],
    queued: [],
  };
  for (const t of tasks) {
    grouped[t.status].push(t);
  }

  const handleDragStart = (taskId: string) => setDragging(taskId);
  const handleDragEnd = () => setDragging(null);
  const handleDrop = (status: Task['status']) => {
    if (dragging) {
      onStatusChange(dragging, status);
      setDragging(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: '#f9fafb',
          borderRadius: '12px',
          width: '90vw',
          maxWidth: '900px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: 'white',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Task Board</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#9ca3af',
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px', padding: '16px', overflowX: 'auto', flex: 1, overflowY: 'hidden' }}>
          {KANBAN_COLUMNS.map(col => (
            <div
              key={col}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col)}
              style={{
                flex: '0 0 200px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: '#f3f4f6',
                borderRadius: '8px',
                padding: '10px',
                minHeight: '200px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLUMN_COLORS[col] }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {STATUS_LABELS[col]}
                </span>
                <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: 'auto' }}>
                  {grouped[col].length}
                </span>
              </div>
              {grouped[col].map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    background: 'white',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    cursor: 'grab',
                    opacity: dragging === task.id ? 0.4 : 1,
                  }}
                >
                  <p style={{ fontSize: '12px', fontWeight: 500, color: '#111827', marginBottom: '4px', lineHeight: 1.3 }}>
                    {task.name}
                  </p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '9px', fontWeight: 600, color: '#6b7280',
                      background: '#f3f4f6', borderRadius: '3px', padding: '1px 5px',
                    }}>
                      {TARGET_LABELS[task.proposal_target]}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {KANBAN_COLUMNS.filter(s => s !== task.status).map(s => (
                      <button
                        key={s}
                        onClick={() => onStatusChange(task.id, s)}
                        style={{
                          fontSize: '9px', fontWeight: 600, padding: '2px 6px',
                          borderRadius: '3px', border: `1px solid ${COLUMN_COLORS[s]}`,
                          color: COLUMN_COLORS[s], background: 'transparent', cursor: 'pointer',
                        }}
                      >
                        → {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {grouped[col].length === 0 && (
                <div style={{ fontSize: '11px', color: '#d1d5db', textAlign: 'center', paddingTop: '16px' }}>
                  Drop here
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface NewTaskFormProps {
  onSave: (name: string, status: Task['status'], target: ProposalTargetType) => Promise<void>;
  onCancel: () => void;
}

function NewTaskForm({ onSave, onCancel }: NewTaskFormProps) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Task['status']>('draft');
  const [target, setTarget] = useState<ProposalTargetType>('notebook');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), status, target);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Task name…"
        className="w-full text-[12px] border border-gray-200 rounded px-2 py-1 mb-1.5 outline-none focus:border-indigo-400"
        style={{ background: 'white' }}
      />
      <div className="flex gap-1.5 mb-1.5">
        <select
          value={status}
          onChange={e => setStatus(e.target.value as Task['status'])}
          className="flex-1 text-[11px] border border-gray-200 rounded px-1.5 py-1 outline-none bg-white"
        >
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="waiting">Waiting</option>
          <option value="queued">Queued</option>
        </select>
        <select
          value={target}
          onChange={e => setTarget(e.target.value as ProposalTargetType)}
          className="flex-1 text-[11px] border border-gray-200 rounded px-1.5 py-1 outline-none bg-white"
        >
          <option value="notebook">Notebook</option>
          <option value="file-tree">File Tree</option>
          <option value="canvas">Canvas</option>
        </select>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 text-[11px] py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="flex-1 text-[11px] py-1 rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Add task'}
        </button>
      </div>
    </form>
  );
}

interface MultitaskerSidebarProps {
  notebookId: string;
  notebookContent: string;
}

export default function MultitaskerSidebar({ notebookId, notebookContent }: MultitaskerSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const loadTasks = useCallback(async () => {
    if (!notebookId) return;
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('notebook_tasks')
      .select('*')
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, [notebookId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isExpanded) {
      loadTasks();
    }
  }, [isExpanded, loadTasks]);

  const handleCreateTask = async (name: string, status: Task['status'], target: ProposalTargetType) => {
    const optimisticTask: Task = {
      id: `local-${Date.now()}`,
      notebook_id: notebookId,
      name,
      status,
      proposal_target: target,
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [optimisticTask, ...prev]);
    setShowNewForm(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('notebook_tasks')
      .insert({
        notebook_id: notebookId,
        name,
        status,
        proposal_target: target,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks(prev => prev.map(t => t.id === optimisticTask.id ? (data as Task) : t));
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('notebook_tasks')
      .update({ status: newStatus })
      .eq('id', taskId);
  };

  if (!isExpanded) {
    return (
      <div
        className="flex flex-col items-center h-full select-none"
        style={{ width: '48px', background: '#ffffff', borderRight: '1px solid #e5e7eb', flexShrink: 0 }}
      >
        {/* Expand toggle at top */}
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center w-full h-12 border-b border-gray-100 hover:bg-gray-50 transition-colors flex-shrink-0"
          title="Open Multitasker"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Tasks icon */}
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center w-full py-3 hover:bg-gray-50 transition-colors"
          title="Tasks"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </button>

        {/* Add task icon */}
        <button
          onClick={() => { setIsExpanded(true); setShowNewForm(true); }}
          className="flex items-center justify-center w-full py-3 hover:bg-gray-50 transition-colors"
          title="New task"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Filter icon */}
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-center w-full py-3 hover:bg-gray-50 transition-colors"
          title="Filters"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
        </button>

        {/* Board icon */}
        <button
          onClick={() => { setIsExpanded(true); setShowBoard(true); }}
          className="flex items-center justify-center w-full py-3 hover:bg-gray-50 transition-colors"
          title="Open task board"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col h-full bg-white overflow-hidden"
        style={{ width: '260px', borderRight: '1px solid #e5e7eb', flexShrink: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-12 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[12px] font-semibold text-gray-700">Multitasker</span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded hover:bg-gray-50"
            title="Collapse"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Main version row */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
          <div className="w-4 h-4 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-[12px] text-gray-700 font-medium">Main version</span>
          <span className="ml-auto text-[10px] text-gray-300">v1</span>
        </div>

        {/* New task button */}
        {!showNewForm && (
          <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 transition-colors font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New task
            </button>
          </div>
        )}

        {/* New task form */}
        {showNewForm && (
          <NewTaskForm onSave={handleCreateTask} onCancel={() => setShowNewForm(false)} />
        )}

        {/* Task list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <p className="text-[11px] text-gray-400 px-3 py-2">Loading tasks…</p>
          )}
          {!loading && tasks.length === 0 && (
            <p className="text-[11px] text-gray-400 px-3 py-4 text-center">No tasks yet. Add one above.</p>
          )}
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              notebookContent={notebookContent}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>

        {/* Filters */}
        <div className="border-t border-gray-100 flex-shrink-0">
          <div className="px-3 py-2">
            <button className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors font-medium uppercase tracking-wide">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
            </button>
          </div>

          {/* Open task board button */}
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowBoard(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-[12px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Open task board
            </button>
          </div>
        </div>
      </div>

      {/* Task board overlay */}
      {showBoard && (
        <TaskBoard
          tasks={tasks}
          onClose={() => setShowBoard(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}
