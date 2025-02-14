import { useApi } from '@backstage/core-plugin-api';
import { fetchApiRef } from '@backstage/core-plugin-api';
import { useEffect, useState } from 'react';

export const useAzureCommitsApi = (repositoryUrl: string) => {
  const fetchApi = useApi(fetchApiRef);
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const response = await fetchApi.fetch(repositoryUrl, {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `:${process.env.AZURE_TOKEN}`,
            ).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch commits');
        }
        const data = await response.json();
        setCommits(data.value);
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
