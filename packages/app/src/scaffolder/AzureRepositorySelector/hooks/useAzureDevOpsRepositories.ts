import { useState, useEffect } from 'react';
import { AzureDevOpsRepositories } from '../types';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

export const useAzureDevOpsRepositories = (
  organization: string,
  project: string,
) => {
  const config = useApi(configApiRef);
  const apiBaseUrl = config.getString('app.env.api_base_url');

  const [repositories, setRepositories] = useState<AzureDevOpsRepositories[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/azure-dev-ops/repositories/${organization}/${project}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRepositories(data.value);
      } catch (err: any) {
        setError(err.message || 'Failed to load repositories');
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, [organization, project, apiBaseUrl]);

  return { repositories, loading, error };
};
