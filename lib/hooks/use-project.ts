import { useState, useEffect } from "react";

interface ProjectInfo {
  id: string;
  name: string;
  description?: string | null;
}

interface CacheEntry {
  data: ProjectInfo;
  timestamp: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
const projectCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<ProjectInfo | null>>();

export function useProject(projectId: string | undefined) {
  const [project, setProject] = useState<ProjectInfo | null>(() => {
    if (!projectId) return null;
    const cached = projectCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    return null;
  });

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      return;
    }

    // Check cache first
    const cached = projectCache.get(projectId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setProject(cached.data);
      return;
    }

    // Deduplicate concurrent requests for the same projectId
    let request = pendingRequests.get(projectId);
    if (!request) {
      request = fetch(`/api/projects/${projectId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            const info: ProjectInfo = { id: data.id, name: data.name, description: data.description };
            projectCache.set(projectId, { data: info, timestamp: Date.now() });
            return info;
          }
          return null;
        })
        .catch(() => null)
        .finally(() => {
          pendingRequests.delete(projectId);
        });
      pendingRequests.set(projectId, request);
    }

    request.then((data) => setProject(data));
  }, [projectId]);

  return project;
}
