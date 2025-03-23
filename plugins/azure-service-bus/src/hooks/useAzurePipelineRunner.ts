/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../api';
import { Build, BuildLog, BuildLogFull, PipelineParams } from '../types';

export interface useAzurePipelineRunnerReturn {
  loading: boolean;
  executionId: number | null;
  build: Build | null;
  buildLogs: BuildLog[] | null;
  buildLogsDetails: BuildLogFull[] | null;
  error: string | null;
  buildInProgress: boolean;
  setError: (error: string | null) => void;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
}

export const useAzurePipelineRunner = (): useAzurePipelineRunnerReturn => {
  const [loading, setLoading] = useState(false);
  const [executionId, setExecutionId] = useState<number | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [buildLogsDetails, setBuildLogsDetails] = useState<BuildLogFull[]>([]);
  const [buildInProgress, setBuildInProgress] = useState<boolean>(false);
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
      setBuildInProgress(true);
      logsRef.current.clear();
    } catch (err) {
      setError('Erro ao iniciar pipeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!executionId) return;

    const fetchLogs = async () => {
      try {
        // 1. Buscar status do build
        const currentBuild = await azureServiceBusApi.fetchBuildById(
          executionId,
        );
        setBuild(currentBuild);

        // 2. Se o build estiver em execução, buscar logs
        if (currentBuild?.status === 'inProgress') {
          const logs = await azureServiceBusApi.fetchBuildLogs(executionId);
          if (logs?.value?.length) {
            setBuildLogs(logs.value);

            // 3. Buscar detalhes dos logs (apenas para novos logs)
            const logsDetalhados = await Promise.all(
              logs.value.map(async log => {
                if (!logsRef.current.has(log.id)) {
                  logsRef.current.add(log.id);
                  return azureServiceBusApi.fetchLogById(log.id, executionId);
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
          }
        }

        // 4. Parar o polling se o build estiver completo
        if (currentBuild?.status === 'completed') {
          setBuildInProgress(false);
          clearInterval(pollingInterval);
        }
      } catch (err) {
        setError('Erro durante o polling');
      }
    };

    // Chamada inicial para evitar esperar o primeiro intervalo
    fetchLogs();

    const pollingInterval = setInterval(fetchLogs, 5000);

    return () => clearInterval(pollingInterval);
  }, [executionId, azureServiceBusApi]);

  return {
    loading,
    executionId,
    build,
    buildLogs,
    buildLogsDetails,
    buildInProgress,
    error,
    setError,
    triggerPipeline,
  };
};
