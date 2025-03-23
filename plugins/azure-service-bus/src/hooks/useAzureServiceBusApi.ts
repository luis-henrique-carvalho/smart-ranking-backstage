/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../api';
import { Build, BuildLog, BuildLogFull, PipelineParams } from '../types';

export interface UseAzureServiceBusApiReturn {
  loading: boolean;
  executionId: number | null;
  build: Build | null;
  buildLogs: BuildLog[] | null;
  buildLogsDetails: BuildLogFull[] | null;
  error: string | null;
  setError: (error: string | null) => void;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
}

export const useAzureServiceBusApi = (): UseAzureServiceBusApiReturn => {
  const [loading, setLoading] = useState(false);
  const [executionId, setExecutionId] = useState<number | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [buildLogsDetails, setBuildLogsDetails] = useState<BuildLogFull[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logsRef = useRef(new Set<number>());
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);

  const triggerPipeline = async (data: PipelineParams): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await azureServiceBusApi.triggerPipeline(data);
      setExecutionId(response.id);
      setBuild(response);
      setBuildLogs([]);
      setBuildLogsDetails([]);
      logsRef.current.clear();
    } catch (err) {
      setError('Erro ao iniciar pipeline');
    } finally {
      setLoading(false);
    }
  };

  // Polling para buscar status do build
  useEffect(() => {
    if (!executionId) return;

    const fetchBuildStatus = async () => {
      try {
        const buildStatus = await azureServiceBusApi.fetchBuildById(
          executionId,
        );
        setBuild(buildStatus);

        // Para o polling se o build estiver completo
        if (buildStatus?.status === 'completed') {
          clearInterval(statusPolling);
        }
      } catch (err) {
        setError('Erro ao buscar status do build');
      }
    };

    const statusPolling = setInterval(fetchBuildStatus, 5000);

    fetchBuildStatus();

    return () => clearInterval(statusPolling);
  }, [executionId, azureServiceBusApi]);

  useEffect(() => {
    if (!executionId || !build || build.status !== 'inProgress') return;

    const fetchLogs = async () => {
      try {
        const logs = await azureServiceBusApi.fetchBuildLogs(executionId);

        if (logs?.value?.length) {
          setBuildLogs(logs.value);
        }
      } catch (err) {
        setError('Erro ao buscar logs');
      }
    };

    const logPolling = setInterval(fetchLogs, 5000);
    fetchLogs();

    return () => clearInterval(logPolling);
  }, [executionId, build, azureServiceBusApi]);

  useEffect(() => {
    if (!buildLogs.length) return;

    const fetchLogDetails = async () => {
      try {
        const logsDetalhados = await Promise.all(
          buildLogs.map(async log => {
            if (!logsRef.current.has(log.id)) {
              logsRef.current.add(log.id);
              return azureServiceBusApi.fetchLogById(log.id, executionId!);
            }
            return null;
          }),
        );

        const filteredLogs = logsDetalhados.filter(
          log => log !== null,
        ) as BuildLogFull[];
        if (filteredLogs.length > 0) {
          setBuildLogsDetails(prev => [...prev, ...filteredLogs]);
        }
      } catch (err) {
        setError('Erro ao buscar detalhes dos logs');
      }
    };

    fetchLogDetails();
  }, [buildLogs, azureServiceBusApi, executionId]);

  return {
    loading,
    executionId,
    build,
    buildLogs,
    buildLogsDetails,
    error,
    setError,
    triggerPipeline,
  };
};
