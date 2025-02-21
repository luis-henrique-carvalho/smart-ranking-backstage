import { useState, useEffect } from 'react';
import { AzureDevOpsProjects } from '../types';

export const useAzureDevOpsProject = (organization: string) => {
  const [projects, setProjects] = useState<AzureDevOpsProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(
          `http://localhost:7007/api/azure-dev-ops/projects/${organization}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setProjects(data.value);
      } catch (err: any) {
        setError(err.message || 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [organization]);

  return { projects, loading, error };
};
