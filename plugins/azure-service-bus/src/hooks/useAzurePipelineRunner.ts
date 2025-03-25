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
  fetchLogs: (buildId: number) => void;
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
    updateQueueState({
      resourceName,
      status: 'completed',
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

  const fetchBuildLogsDetails = async (buildId: number) => {
    try {
      const logs = await azureServiceBusApi.fetchBuildLogs(buildId);

      if (logs?.value?.length) {
        setBuildLogs(logs.value);

        const logsDetalhados = await Promise.all(
          logs.value.map(async log => {
            if (!logsRef.current.has(log.id)) {
              logsRef.current.add(log.id);
              return azureServiceBusApi.fetchLogById(log.id, buildId);
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
    } catch (err) {
      setError('Erro ao buscar logs do build');
    }
  };

  const fetchAllLogsDetails = async (buildId: number) => {
    try {
      const logs = await azureServiceBusApi.fetchBuildLogs(buildId);

      if (logs?.value?.length) {
        setBuildLogs(logs.value);

        const detailedLogs = await Promise.all(
          logs.value.map(log =>
            azureServiceBusApi.fetchLogById(log.id, buildId),
          ),
        );

        const filteredLogs = detailedLogs.filter(
          log => log !== null,
        ) as BuildLogFull[];

        if (filteredLogs.length > 0) {
          setBuildLogsDetails(filteredLogs);
        }
      }
    } catch (err) {
      setError('Erro ao buscar todos os logs do build');
    }
  };

  const fetchLogs = async (buildId: number) => {
    console.log('fetchLogs', buildId);
    try {
      // 1. Buscar status do build
      const currentBuild = await azureServiceBusApi.fetchBuildById(buildId);
      setBuild(currentBuild);

      // 2. Se o build estiver em execução, buscar logs
      if (currentBuild?.status === 'inProgress') {
        await fetchBuildLogsDetails(buildId);
      } else if (currentBuild?.status === 'completed') {
        await fetchAllLogsDetails(buildId);
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

  useEffect(() => {
    if (queueManagerState.length === 0) return;

    const processQueueItems = async () => {
      for (const q of queueManagerState) {
        if (q.status === 'queued' || q.status === 'running') {
          await fetchLogs(q.buildId);
        }
      }
    };

    console.log('processQueueItems');

    processQueueItems();

    const pollingInterval = setInterval(processQueueItems, 5000);
    return () => clearInterval(pollingInterval);
  }, [lastBuildId, azureServiceBusApi]);

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
    fetchLogs,
  };
};
