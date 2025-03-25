/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { useEffect, useRef, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../api';
import { Build, BuildLog, BuildLogFull, PipelineParams } from '../types';

type ResourceType = 'queue' | 'topic';
type QueueStatus = 'queued' | 'running' | 'completed';

interface QueueItem {
  resourceName: string;
  resourceType: ResourceType;
  buildId: number;
  status: QueueStatus;
  timestamp: number;
}

export interface useAzurePipelineRunnerReturn {
  loading: boolean;
  lastBuildId: number | null;
  build: Build | null;
  buildLogs: BuildLog[] | null;
  buildLogsDetails: BuildLogFull[] | null;
  error: string | null;
  queueManagerState: QueueItem[];
  setLastBuildId: (id: number) => void;
  setError: (error: string | null) => void;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
  resetState: () => void;
  startRunning: (resourceName: string) => void;
  completeRun: (resourceName: string) => void;
}

const LOCAL_STORAGE_KEY = 'azurePipelineQueueManager';

export const useAzurePipelineRunner = (): useAzurePipelineRunnerReturn => {
  const [loading, setLoading] = useState(false);
  const [lastBuildId, setLastBuildId] = useState<number | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [buildLogsDetails, setBuildLogsDetails] = useState<BuildLogFull[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [queueManagerState, setQueueManagerState] = useState<QueueItem[]>([]);

  const logsRef = useRef(new Set<number>());
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);

  // Carrega os builds em execução do localStorage quando o hook é inicializado
  useEffect(() => {
    const savedQueues = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedQueues) {
      const queues: QueueItem[] = JSON.parse(savedQueues);
      // Filtra itens com mais de 24 horas para limpeza
      const filteredQueues = queues.filter(
        q => Date.now() - q.timestamp < 86400000,
      );
      setQueueManagerState(filteredQueues);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredQueues));
    }
  }, []);

  const updateQueueState = (
    newQueue: Partial<QueueItem> & { resourceName: string },
  ) => {
    setQueueManagerState(prevQueues => {
      const existingIndex = prevQueues.findIndex(
        q => q.resourceName === newQueue.resourceName,
      );
      let updatedQueues: QueueItem[];

      if (existingIndex !== -1) {
        updatedQueues = [...prevQueues];
        updatedQueues[existingIndex] = {
          ...updatedQueues[existingIndex],
          ...newQueue,
          timestamp:
            newQueue.timestamp || updatedQueues[existingIndex].timestamp,
        };
      } else {
        updatedQueues = [
          ...prevQueues,
          {
            resourceName: newQueue.resourceName,
            resourceType: newQueue.resourceType || 'queue',
            buildId: newQueue.buildId || 0,
            status: newQueue.status || 'queued',
            timestamp: newQueue.timestamp || Date.now(),
          },
        ];
      }

      // Ordena a fila: running first, then queued by timestamp
      updatedQueues.sort((a, b) => {
        if (a.status === 'running' && b.status !== 'running') return -1;
        if (a.status !== 'running' && b.status === 'running') return 1;
        return a.timestamp - b.timestamp;
      });

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedQueues));
      return updatedQueues;
    });
  };

  const startRunning = (resourceName: string) => {
    updateQueueState({
      resourceName,
      status: 'running',
    });
  };

  const completeRun = (resourceName: string) => {
    setQueueManagerState(prevQueues => {
      const updatedQueues = prevQueues.filter(
        q => q.resourceName !== resourceName,
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedQueues));
      return updatedQueues;
    });
  };

  const triggerPipeline = async (data: PipelineParams): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await azureServiceBusApi.triggerPipeline(data);
      setLastBuildId(response.id);
      setBuild(response);
      setBuildLogs([]);
      setBuildLogsDetails([]);
      logsRef.current.clear();

      updateQueueState({
        resourceName: data.resource_name,
        resourceType: data.resource_type as ResourceType,
        buildId: response.id,
        status: 'queued',
      });
    } catch (err) {
      setError('Erro ao iniciar pipeline');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setLastBuildId(null);
    setBuild(null);
    setBuildLogs([]);
    setBuildLogsDetails([]);
    logsRef.current.clear();
  };

  useEffect(() => {
    if (!lastBuildId || !build) return;

    const fetchLogs = async () => {
      try {
        // 1. Buscar status do build
        const currentBuild = await azureServiceBusApi.fetchBuildById(
          lastBuildId,
        );
        setBuild(currentBuild);

        // 2. Se o build estiver em execução, buscar logs
        if (
          currentBuild?.status === 'inProgress' ||
          currentBuild?.status === 'completed'
        ) {
          const logs = await azureServiceBusApi.fetchBuildLogs(lastBuildId);

          if (logs?.value?.length) {
            setBuildLogs(logs.value);

            const logsDetalhados = await Promise.all(
              logs.value.map(async log => {
                if (!logsRef.current.has(log.id)) {
                  logsRef.current.add(log.id);
                  return azureServiceBusApi.fetchLogById(log.id, lastBuildId);
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

        // Atualiza estado da fila
        const queueItem = currentBuild
          ? queueManagerState.find(q => q.buildId === currentBuild.id)
          : undefined;

        if (queueItem) {
          if (
            currentBuild?.status === 'inProgress' &&
            queueItem.status !== 'running'
          ) {
            startRunning(queueItem.resourceName);
          } else if (currentBuild && currentBuild.status === 'completed') {
            completeRun(queueItem.resourceName);
          }
        }
      } catch (err) {
        setError('Erro durante o polling');
      }
    };

    fetchLogs();
    const pollingInterval = setInterval(fetchLogs, 5000);
    return () => clearInterval(pollingInterval);
  }, [lastBuildId, build?.id, azureServiceBusApi]);

  return {
    loading,
    lastBuildId,
    build,
    buildLogs,
    buildLogsDetails,
    queueManagerState,
    setLastBuildId,
    error,
    setError,
    triggerPipeline,
    resetState,
    startRunning,
    completeRun,
  };
};
