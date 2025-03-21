import { useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../api';
import { PipelineParams } from '../types';

export interface UseAzureServiceBusApiReturn {
  loading: boolean;
  error: Error | null;
  pipelineRunId: number | null;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
}

export const useAzureServiceBusApi = (): UseAzureServiceBusApiReturn => {
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);
  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const triggerPipeline = async (data: PipelineParams): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await azureServiceBusApi.triggerPipeline(data);

      setPipelineRunId(response.id);

      return response;
    } catch (err) {
      const caughtError =
        err instanceof Error ? err : new Error('Unknown error occurred');
      setError(caughtError);
      throw caughtError;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    pipelineRunId,
    triggerPipeline,
  };
};
