import { useState, useEffect } from 'react';
import { AzureDevOpsRepositories } from '../types';

export const useAzureDevOpsRepositories = (
  organization: string,
  project: string,
) => {
  const [repositories, setRepositories] = useState<AzureDevOpsRepositories[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const response = await fetch(
          `http://localhost:7007/api/azure-dev-ops/repositories/${organization}/${project}`,
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
  }, [organization, project]);

  return { repositories, loading, error };
};
