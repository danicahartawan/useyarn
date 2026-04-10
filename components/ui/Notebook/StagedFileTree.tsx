'use client';

import { useState } from 'react';
import { useProposals } from './ProposalContext';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  staged?: boolean;
  children?: FileNode[];
}

const INITIAL_FILE_TREE: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      {
        id: 'components',
        name: 'components',
        type: 'folder',
        children: [
          { id: 'App.tsx', name: 'App.tsx', type: 'file' },
          { id: 'Header.tsx', name: 'Header.tsx', type: 'file' },
        ],
      },
    ],
  },
  {
    id: 'docs',
    name: 'docs',
    type: 'folder',
    children: [
      { id: 'README.md', name: 'README.md', type: 'file' },
    ],
  },
  { id: 'package.json', name: 'package.json', type: 'file' },
];

function FileIcon({ type, staged }: { type: 'file' | 'folder'; staged?: boolean }) {
  if (type === 'folder') {
    return (
      <svg
        width="11" height="11" fill="none" viewBox="0 0 24 24"
        stroke={staged ? '#d97706' : '#9ca3af'}
        style={{ flexShrink: 0 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h3l2 2h9a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      </svg>
    );
  }
  return (
    <svg
      width="11" height="11" fill="none" viewBox="0 0 24 24"
      stroke={staged ? '#059669' : '#9ca3af'}
      style={{ flexShrink: 0 }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TreeNode({ node, depth = 0, defaultOpen = false }: { node: FileNode; depth?: number; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen || depth < 1);

  const paddingLeft = 8 + depth * 12;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', width: '100%',
            padding: `3px 8px 3px ${paddingLeft}px`,
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <svg
            width="8" height="8" fill="none" stroke={node.staged ? '#d97706' : '#9ca3af'}
            viewBox="0 0 24 24"
            style={{ flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <FileIcon type="folder" staged={node.staged} />
          <span style={{
            fontSize: '11px',
            color: node.staged ? '#92400e' : '#4b5563',
            fontWeight: node.staged ? 600 : 500,
            fontStyle: node.staged ? 'italic' : 'normal',
          }}>
            {node.name}
          </span>
          {node.staged && (
            <span style={{
              fontSize: '8px', fontWeight: 700, color: '#d97706',
              background: '#fef3c7', border: '1px solid #fde68a',
              borderRadius: '2px', padding: '0 3px', marginLeft: '3px',
            }}>
              staged
            </span>
          )}
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} defaultOpen={child.staged} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: `3px 8px 3px ${paddingLeft}px`,
        background: node.staged ? '#f0fdf4' : 'transparent',
        borderLeft: node.staged ? '2px solid #22c55e' : '2px solid transparent',
      }}
    >
      <FileIcon type="file" staged={node.staged} />
      <span style={{
        fontSize: '11px',
        color: node.staged ? '#065f46' : '#6b7280',
        fontStyle: node.staged ? 'italic' : 'normal',
        fontWeight: node.staged ? 600 : 400,
      }}>
        {node.staged ? '+ ' : ''}{node.name}
      </span>
      {node.staged && (
        <span style={{
          fontSize: '8px', fontWeight: 700, color: '#059669',
          background: '#d1fae5', border: '1px solid #6ee7b7',
          borderRadius: '2px', padding: '0 3px', marginLeft: '2px',
        }}>
          new
        </span>
      )}
    </div>
  );
}

interface StagedFileTreeProps {
  fileTree: FileNode[];
}

export default function StagedFileTree({ fileTree }: StagedFileTreeProps) {
  const { proposals } = useProposals();
  const proposal = proposals['file-tree'];
  const isPending = proposal?.status === 'pending';

  return (
    <div
      style={{
        borderTop: '1px solid #e5e7eb',
        background: isPending ? '#fffbeb' : 'white',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px 2px',
        borderBottom: '1px solid #f3f4f6',
      }}>
        <svg width="10" height="10" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h3l2 2h9a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Files
        </span>
        {isPending && (
          <span style={{
            fontSize: '8px', fontWeight: 700, color: '#d97706',
            background: '#fef3c7', border: '1px solid #fde68a',
            borderRadius: '2px', padding: '0 4px', marginLeft: 'auto',
          }}>
            1 staged change
          </span>
        )}
      </div>
      <div style={{ maxHeight: '140px', overflowY: 'auto', padding: '2px 0' }}>
        {fileTree.map(node => (
          <TreeNode key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
