'use client';

import { useProposals, ProposalTargetType, ProposalEntry } from './ProposalContext';

const TARGET_LABELS: Record<ProposalTargetType, string> = {
  notebook: 'Notebook',
  'file-tree': 'File Tree',
  canvas: 'Canvas',
};

function SingleReviewCard({
  entry,
  targetType,
}: {
  entry: ProposalEntry;
  targetType: ProposalTargetType;
}) {
  const { applyProposal, dismissProposal } = useProposals();

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '280px',
        maxWidth: '340px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            background: '#f3f4f6',
            borderRadius: '4px',
            padding: '1px 6px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          {TARGET_LABELS[targetType]}
        </span>
        <span
          style={{
            background: '#ede9fe',
            borderRadius: '4px',
            padding: '1px 6px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#6d28d9',
            flexShrink: 0,
          }}
        >
          Task {entry.taskId.replace('t-', '#')}
        </span>
        <span
          style={{
            fontSize: '12px',
            color: '#374151',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={entry.taskName}
        >
          {entry.taskName}
        </span>
      </div>
      <p
        style={{
          fontSize: '11px',
          color: '#6b7280',
          margin: 0,
          lineHeight: '1.4',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        <span style={{ color: '#059669', fontWeight: 600 }}>Proposed: </span>
        {entry.proposedValue}
      </p>
      {entry.researchSources && entry.researchSources.length > 0 && (
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '6px' }}>
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
            Research sources
          </p>
          {entry.researchSources.slice(0, 3).map((src, i) => (
            <a
              key={i}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                color: '#3b82f6',
                textDecoration: 'none',
                marginBottom: '2px',
                overflow: 'hidden',
              }}
            >
              <span style={{ flexShrink: 0 }}>↗</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {src.title || src.url}
              </span>
            </a>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => dismissProposal(targetType)}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: '12px',
            fontWeight: 500,
            color: '#6b7280',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
          onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = '#f9fafb')}
        >
          Dismiss
        </button>
        <button
          onClick={() => applyProposal(targetType)}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: '12px',
            fontWeight: 600,
            color: 'white',
            background: '#111827',
            border: '1px solid #111827',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => ((e.target as HTMLButtonElement).style.background = '#374151')}
          onMouseLeave={e => ((e.target as HTMLButtonElement).style.background = '#111827')}
        >
          Apply to main
        </button>
      </div>
    </div>
  );
}

export default function ReviewCard() {
  const { proposals } = useProposals();

  const pending = (Object.entries(proposals) as [ProposalTargetType, typeof proposals[ProposalTargetType]][]).filter(
    ([, entry]) => entry && entry.status === 'pending'
  );

  if (pending.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {pending.map(([targetType, entry]) => (
        <div key={targetType} style={{ pointerEvents: 'auto' }}>
          <SingleReviewCard entry={entry!} targetType={targetType} />
        </div>
      ))}
    </div>
  );
}
