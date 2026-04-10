'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  iconType?: string;
  content?: string;
  children?: FileNode[];
}

interface NotebookContextValue {
  fileTree: FileNode[];
  setFileTree: React.Dispatch<React.SetStateAction<FileNode[]>>;
  selectedFileId: string | null;
  setSelectedFileId: (id: string | null) => void;
  getFileById: (id: string) => FileNode | null;
}

const NotebookContext = createContext<NotebookContextValue | null>(null);

function findFileById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function NotebookProvider({ children }: { children: React.ReactNode }) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const getFileById = useCallback((id: string): FileNode | null => {
    return findFileById(fileTree, id);
  }, [fileTree]);

  return (
    <NotebookContext.Provider value={{ fileTree, setFileTree, selectedFileId, setSelectedFileId, getFileById }}>
      {children}
    </NotebookContext.Provider>
  );
}

export function useNotebook() {
  const ctx = useContext(NotebookContext);
  if (!ctx) throw new Error('useNotebook must be used inside NotebookProvider');
  return ctx;
}
