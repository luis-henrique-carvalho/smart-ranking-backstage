import { useApi } from '@backstage/core-plugin-api';
import { AzureCommitsApiRef } from '../api';
import { useEffect, useState } from 'react';
import { Commit } from '../types';

export const useCommitsApi = (
  repositoryId: string,
  organization: string,
  project: string,
  selectedBranch: string,
) => {
  const fetchApi = useApi(AzureCommitsApiRef);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getCommitsUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repositoryId}/commits?searchCriteria.itemVersion.version=${selectedBranch}&api-version=7.1-preview.1`;

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setLoading(true);
        const response = await fetchApi.getCommits(getCommitsUrl);
        setCommits(response.value);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, [fetchApi, getCommitsUrl]);

  return { commits, loading, error };
};
