import { useState, useEffect } from 'react';
import { AzureDevOpsProjects } from '../types';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

export const useAzureDevOpsProject = (organization: string) => {
  const config = useApi(configApiRef);
  // TODO: Use the config object to get the API base URL
  const apiBaseUrl = 'http://localhost:7007';

  const [projects, setProjects] = useState<AzureDevOpsProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/azure-dev-ops/projects/${organization}`,
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
  }, [organization, apiBaseUrl]);

  return { projects, loading, error };
};
