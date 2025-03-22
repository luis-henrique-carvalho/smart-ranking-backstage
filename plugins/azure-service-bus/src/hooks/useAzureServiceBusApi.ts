import { useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../api';
import { PipelineParams } from '../types';

export interface UseAzureServiceBusApiReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: Error | null;
  pipelineRunId: number | null;
  build: any | null;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
  fetchBuildById: (buildId: number) => Promise<void | null>;
  fetchBuildLogs: (buildId: number) => Promise<any | null>;
  fetchBuildLogsById: (logId: number) => Promise<any | null>;
}

export const useAzureServiceBusApi = (): UseAzureServiceBusApiReturn => {
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);
  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(122);
  const [error, setError] = useState<Error | null>(null);
  const [build, setBuild] = useState<any | null>(null);

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

  const fetchBuildLogs = async (buildId: number): Promise<any | null> => {
    setLoading(true);
    setError(null);

    try {
      const logs = await azureServiceBusApi.fetchBuildLogs(buildId);

      return logs;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));

      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildById = async (buildId: number): Promise<void | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await azureServiceBusApi.fetchBuildById(buildId);

      setBuild(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));

      return null;
    } finally {
      setLoading(false);
    }

    return null;
  };

  const fetchBuildLogsById = async (logId: number): Promise<any | null> => {
    setLoading(true);
    setError(null);

    try {
      const log = await azureServiceBusApi.fetchLogByid(
        logId,
        pipelineRunId || 0,
      );

      return log;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));

      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchBuildById,
    setLoading,
    build,
    error,
    pipelineRunId,
    triggerPipeline,
    fetchBuildLogs,
    fetchBuildLogsById,
  };
};
