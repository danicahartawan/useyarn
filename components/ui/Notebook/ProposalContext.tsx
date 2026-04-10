'use client';

import { createContext, useContext, useState, useRef, ReactNode } from 'react';

export type ProposalTargetType = 'notebook' | 'file-tree' | 'canvas';
export type ProposalStatus = 'pending' | 'applied' | 'dismissed';

export interface ResearchSource {
  url: string;
  title: string;
}

export interface ProposalEntry {
  targetType: ProposalTargetType;
  taskId: string;
  taskName: string;
  proposedValue: string;
  originalValue: string;
  status: ProposalStatus;
  researchSources?: ResearchSource[];
}

type ApplyCallbacks = {
  onApplyNotebook?: (text: string) => void;
  onApplyCanvas?: (label: string) => void;
  onApplyFileTree?: (label: string) => void;
};

interface ProposalStore {
  proposals: Record<ProposalTargetType, ProposalEntry | null>;
  proposeEdit: (entry: Omit<ProposalEntry, 'status'>) => 'ok' | 'blocked';
  applyProposal: (targetType: ProposalTargetType) => void;
  dismissProposal: (targetType: ProposalTargetType) => void;
  registerCallbacks: (cbs: ApplyCallbacks) => void;
}

const ProposalContext = createContext<ProposalStore | null>(null);

export function ProposalProvider({ children }: { children: ReactNode }) {
  const [proposals, setProposals] = useState<Record<ProposalTargetType, ProposalEntry | null>>({
    notebook: null,
    'file-tree': null,
    canvas: null,
  });

  const callbacksRef = useRef<ApplyCallbacks>({});

  const registerCallbacks = (cbs: ApplyCallbacks) => {
    callbacksRef.current = { ...callbacksRef.current, ...cbs };
  };

  const proposeEdit = (entry: Omit<ProposalEntry, 'status'>): 'ok' | 'blocked' => {
    const existing = proposals[entry.targetType];
    if (existing && existing.status === 'pending') {
      return 'blocked';
    }
    setProposals(prev => ({
      ...prev,
      [entry.targetType]: { ...entry, status: 'pending' },
    }));
    return 'ok';
  };

  const applyProposal = (targetType: ProposalTargetType) => {
    const entry = proposals[targetType];
    if (!entry || entry.status !== 'pending') return;

    if (targetType === 'notebook' && callbacksRef.current.onApplyNotebook) {
      callbacksRef.current.onApplyNotebook(entry.proposedValue);
    }
    if (targetType === 'canvas' && callbacksRef.current.onApplyCanvas) {
      callbacksRef.current.onApplyCanvas(entry.proposedValue);
    }
    if (targetType === 'file-tree' && callbacksRef.current.onApplyFileTree) {
      callbacksRef.current.onApplyFileTree(entry.proposedValue);
    }

    setProposals(prev => ({
      ...prev,
      [targetType]: { ...entry, status: 'applied' },
    }));
  };

  const dismissProposal = (targetType: ProposalTargetType) => {
    const entry = proposals[targetType];
    if (!entry || entry.status !== 'pending') return;
    setProposals(prev => ({
      ...prev,
      [targetType]: { ...entry, status: 'dismissed' },
    }));
  };

  return (
    <ProposalContext.Provider
      value={{
        proposals,
        proposeEdit,
        applyProposal,
        dismissProposal,
        registerCallbacks,
      }}
    >
      {children}
    </ProposalContext.Provider>
  );
}

export function useProposals() {
  const ctx = useContext(ProposalContext);
  if (!ctx) throw new Error('useProposals must be used inside ProposalProvider');
  return ctx;
}
