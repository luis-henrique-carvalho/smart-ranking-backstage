import { useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../api';
import { Build, BuildLog, BuildLogFull, PipelineParams } from '../types';

export interface UseAzureServiceBusApiReturn {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: Error | null;
  pipelineRunId: number | null;
  build: Build | null;
  buildLogs: BuildLog[] | null;
  buildLogsFull: BuildLogFull[] | null;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
  fetchBuildById: (buildId: number) => Promise<void>;
  fetchBuildLogs: (buildId: number) => Promise<void>;
  fetchBuildLogsById: (logId: number) => Promise<void>;
}

export const useAzureServiceBusApi = (): UseAzureServiceBusApiReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [buildLogs, setBuildLogs] = useState<BuildLog[] | null>(null);
  const [buildLogsFull, setBuildLogsFull] = useState<BuildLogFull[] | null>(
    null,
  );
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);

  const triggerPipeline = async (data: PipelineParams): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await azureServiceBusApi.triggerPipeline(data);

      console.log('Novo pipelineRunId:', response.id); // Verifica o valor recebido
      setPipelineRunId(response.id);
      setBuild(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildLogs = async (buildId: number): Promise<any | null> => {
    setLoading(true);
    setError(null);

    try {
      const logs = await azureServiceBusApi.fetchBuildLogs(buildId);

      setBuildLogs(logs.value);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildById = async (buildId: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await azureServiceBusApi.fetchBuildById(buildId);

      setBuild(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildLogsById = async (logId: number): Promise<void> => {
    setLoading(true);
    setError(null);

    if (!pipelineRunId) {
      return;
    }

    try {
      const log = await azureServiceBusApi.fetchLogById(logId, pipelineRunId);

      setBuildLogsFull(prev => (prev ? [...prev, log] : [log]));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchBuildById,
    setLoading,
    build,
    buildLogs,
    buildLogsFull,
    error,
    pipelineRunId,
    triggerPipeline,
    fetchBuildLogs,
    fetchBuildLogsById,
  };
};
