import { useApi } from '@backstage/core-plugin-api';
import { AzureCommitsApiRef } from '../api';
import { useEffect, useState } from 'react';
import { Commit } from '../types';

export const useAzureCommitsApi = (
  repositoryId: string,
  organization: string,
  project: string,
) => {
  const fetchApi = useApi(AzureCommitsApiRef);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const repositoryUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repositoryId}/commits?api-version=7.1-preview.1`;

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const response = await fetchApi.getCommits(repositoryUrl);

        setCommits(response.value);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, [fetchApi, repositoryUrl]);

  return { commits, loading, error };
};
