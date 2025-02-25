import { useState, useEffect } from 'react';
import { AzureDevOpsReleasePipeline } from '../types';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

export const useAzureDevOpsPipelines = (
  organization: string,
  project: string,
) => {
  const config = useApi(configApiRef);
  const apiBaseUrl = 'http://localhost:7007';

  const [pipelines, setPipelines] = useState<AzureDevOpsReleasePipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/azure-dev-ops/release-pipelines/${organization}/${project}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPipelines(data.value);
      } catch (err: any) {
        setError(err.message || 'Failed to load pipelines');
      } finally {
        setLoading(false);
      }
    };

    fetchPipelines();
  }, [organization, project, apiBaseUrl]);

  return { pipelines, loading, error };
};
