import { useApi } from '@backstage/core-plugin-api';
import { AzureCommitsApiRef } from '../api';
import { useEffect, useState } from 'react';
import { Branch, Commit } from '../types';

export const useAzureCommitsApi = (
  repositoryId: string,
  organization: string,
  project: string,
) => {
  const fetchApi = useApi(AzureCommitsApiRef);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('master');

  const getCommitsUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repositoryId}/commits?searchCriteria.itemVersion.version=${selectedBranch}&api-version=7.1-preview.1`;
  const getBranchesUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repositoryId}/refs?filter=heads&api-version=7.1-preview.1`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const branchesResponse = await fetchApi.getBranches(getBranchesUrl);
        const commitsResponse = await fetchApi.getCommits(getCommitsUrl);

        setBranches(
          branchesResponse.value.map((b: any) => ({
            ...b,
            name: b.name.replace('refs/heads/', ''),
          })),
        );
        setCommits(commitsResponse.value);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchApi, selectedBranch, getBranchesUrl, getCommitsUrl]);

  return {
    commits,
    loading,
    error,
    branches,
    selectedBranch,
    setSelectedBranch,
  };
};
