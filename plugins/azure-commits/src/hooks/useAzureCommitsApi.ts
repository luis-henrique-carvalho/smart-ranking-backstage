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
  const [branchLIst, setBranchList] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('master');

  const getCommitsUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repositoryId}/commits?refs?filter=refs/heads/${selectedBranch}&api-version=7.1-preview.1`;
  const getBranchesUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repositoryId}/refs?filter=heads&api-version=7.1-preview.1`;

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const responseBranchs = await fetchApi.getBranches(getBranchesUrl);
        const responseCommit = await fetchApi.getCommits(getCommitsUrl);

        setCommits(responseCommit.value);
        setBranchList(responseBranchs.value);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, [fetchApi, getCommitsUrl, getBranchesUrl, selectedBranch]);

  return {
    commits,
    loading,
    error,
    branchLIst,
    selectedBranch,
    setSelectedBranch,
  };
};
