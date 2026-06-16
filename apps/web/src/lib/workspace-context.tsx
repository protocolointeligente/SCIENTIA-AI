'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceContextValue {
  workspaceId: string | null;
  workspace: WorkspaceInfo | null;
  isLoading: boolean;
}

const WorkspaceCtx = createContext<WorkspaceContextValue>({
  workspaceId: null,
  workspace: null,
  isLoading: true,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('scientia:workspaceId');
    if (cached) {
      // Try stored value first, verify it's still valid by provisioning
      setWorkspace({ id: cached, name: '', slug: '' });
    }

    apiFetch<WorkspaceInfo>('/workspaces/provision', { method: 'POST' })
      .then((ws) => {
        setWorkspace(ws);
        localStorage.setItem('scientia:workspaceId', ws.id);
      })
      .catch(() => {
        // Not logged in — clear stored workspace
        localStorage.removeItem('scientia:workspaceId');
        setWorkspace(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <WorkspaceCtx.Provider value={{ workspaceId: workspace?.id ?? null, workspace, isLoading }}>
      {children}
    </WorkspaceCtx.Provider>
  );
}

export function useActiveWorkspace() {
  return useContext(WorkspaceCtx);
}
