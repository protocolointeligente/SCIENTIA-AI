'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api';

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceContextValue {
  workspaceId: string | null;
  workspace: WorkspaceInfo | null;
  session: Session | null;
  isLoading: boolean;
}

const WorkspaceCtx = createContext<WorkspaceContextValue>({
  workspaceId: null,
  workspace: null,
  session: null,
  isLoading: true,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function provisionForSession(s: Session) {
      try {
        const ws = await apiFetch<WorkspaceInfo>('/workspaces/provision', {
          method: 'POST',
          token: s.access_token,
        });
        setWorkspace(ws);
        localStorage.setItem('scientia:workspaceId', ws.id);
      } catch (err) {
        console.error('[WorkspaceProvider] provision failed:', err);
        // Fallback: try to use cached ID
        const cached = localStorage.getItem('scientia:workspaceId');
        if (cached) setWorkspace({ id: cached, name: 'Workspace', slug: '' });
        else setWorkspace(null);
      } finally {
        setIsLoading(false);
      }
    }

    // Get initial session (may already be set from SSR cookie)
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      if (s) {
        provisionForSession(s);
      } else {
        setIsLoading(false);
      }
    });

    // React to future auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s) {
          provisionForSession(s);
        } else {
          setWorkspace(null);
          localStorage.removeItem('scientia:workspaceId');
          setIsLoading(false);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <WorkspaceCtx.Provider
      value={{ workspaceId: workspace?.id ?? null, workspace, session, isLoading }}
    >
      {children}
    </WorkspaceCtx.Provider>
  );
}

export function useActiveWorkspace() {
  return useContext(WorkspaceCtx);
}
