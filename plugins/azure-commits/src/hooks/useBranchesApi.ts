import { useApi } from '@backstage/core-plugin-api';
import { AzureCommitsApiRef } from '../api';
import { useEffect, useState } from 'react';
import { Branch } from '../types';

export const useBranchesApi = (
  repositoryId: string,
  organization: string,
  project: string,
) => {
  const fetchApi = useApi(AzureCommitsApiRef);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getBranchesUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repositoryId}/refs?filter=heads&api-version=7.1-preview.1`;

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const response = await fetchApi.getBranches(getBranchesUrl);
        setBranches(
          response.value.map((b: any) => ({
            ...b,
            name: b.name.replace('refs/heads/', ''),
          })),
        );
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [fetchApi, getBranchesUrl]);

  return { branches, loading, error };
};
