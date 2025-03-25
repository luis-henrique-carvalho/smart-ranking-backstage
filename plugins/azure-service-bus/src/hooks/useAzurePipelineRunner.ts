/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react';
import { AzureServiceBusApiRef } from '../api';
import { useApi } from '@backstage/core-plugin-api';
import { BuildLogFull, PipelineParams } from '../types';

type QueueStatus = 'queued' | 'running' | 'completed';
type ResourceType = 'queue' | 'topic';

export interface useAzurePipelineRunnerReturn {
  loading: boolean;
  error: string | null;
  buildLogsDetails: BuildLogFull[];
  buildMenagerState: Record<string, BuildItem>;
  currentBuildView: string | null;
  startRumBuild: (resourceName: string) => Promise<void>;
  completeRumBuild: (resourceName: string) => Promise<void>;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
  changeCurrentBuildViewAndFetchLogs: (resourceName: string) => void;
}

interface BuildItem {
  resourceType: ResourceType;
  buildId: number;
  status: QueueStatus;
  timestamp: number;
}

type BuildMenagerState = Record<string, BuildItem>;

const LOCAL_STORAGE_KEY = 'azurePipelineQueueManager';

export const useAzurePipelineRunner = (): useAzurePipelineRunnerReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildLogsDetails, setBuildLogsDetails] = useState<BuildLogFull[]>([]);
  const [currentBuildView, setCurrentBuildView] = useState<string | null>(null);
  const [buildMenagerState, setBuildMenagerState] = useState<BuildMenagerState>(
    {},
  );

  const logsRefByBuildId = useRef(new Map<string, number[]>());
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);

  useEffect(() => {
    const savedQueues = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (savedQueues) {
      const queues: BuildMenagerState = JSON.parse(savedQueues);
      const filteredQueues = Object.entries(queues).reduce(
        (acc, [resourceName, item]) => {
          if (Date.now() - item.timestamp < 86400000) {
            acc[resourceName] = item;
          }

          return acc;
        },
        {} as BuildMenagerState,
      );

      setBuildMenagerState(filteredQueues);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredQueues));
    }
  }, []);

  const updateBuildState = (newBuild: BuildMenagerState) => {
    setBuildMenagerState(prevState => {
      const newState = { ...prevState };

      // Atualiza ou adiciona cada item de newBuild ao estado atual
      Object.entries(newBuild).forEach(([resourceName, newItem]) => {
        newState[resourceName] = {
          ...prevState[resourceName], // Mantém os dados existentes, se houver
          ...newItem, // Sobrescreve apenas os campos fornecidos em newBuild
        };
      });

      // Atualiza o localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const startRumBuild = async (resourceName: string): Promise<void> => {
    const buildItem = buildMenagerState[resourceName];

    updateBuildState({
      [resourceName]: {
        ...buildItem,
        status: 'running',
      },
    });
  };

  const completeRumBuild = async (resourceName: string): Promise<void> => {
    const buildItem = buildMenagerState[resourceName];

    updateBuildState({
      [resourceName]: {
        ...buildItem,
        status: 'completed',
      },
    });
  };

  const triggerPipeline = async (data: PipelineParams): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const build = await azureServiceBusApi.triggerPipeline(data);

      setBuildLogsDetails([]);
      logsRefByBuildId.current.delete(data.resource_name);
      setCurrentBuildView(data.resource_name);

      updateBuildState({
        [data.resource_name]: {
          resourceType: data.resource_type,
          buildId: build.id,
          status: 'queued',
          timestamp: Date.now(),
        },
      });
    } catch (e) {
      setError('Erro ao disparar pipeline');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildLogsDetails = async (buildId: number) => {
    try {
      const logs = await azureServiceBusApi.fetchBuildLogs(buildId);

      console.log('fetchBuildLogsDetails', logs.count);

      if (logs?.value?.length) {
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
      setError('Erro ao buscar logs');
    }
  };

  const changeCurrentBuildViewAndFetchLogs = (resourceName: string) => {
    setBuildLogsDetails([]);

    if (buildMenagerState[resourceName].status === 'completed') {
      logsRefByBuildId.current.delete(resourceName);
    }

    setCurrentBuildView(resourceName);

    if (buildMenagerState[resourceName]) {
      fetchBuildLogsDetails(buildMenagerState[resourceName].buildId);
    }
  };

  useEffect(() => {
    // so continue caso hája buildMenagerState em execução ou na fila
    if (
      !Object.values(buildMenagerState).some(
        q => q.status === 'queued' || q.status === 'running',
      )
    ) {
      return;
    }

    // atualiza o status de todos os builds baseado na resposta da API com o await azureServiceBusApi.fetchBuildById(buildId); usando promise.all
    const fetchBuilds = async () => {
      console.log('fetchBuilds');

      await Promise.all(
        Object.entries(buildMenagerState)
          .filter(([, q]) => q.status === 'queued' || q.status === 'running')
          .map(async ([resourceName, content]) => {
            const build = await azureServiceBusApi.fetchBuildById(
              content.buildId,
            );

            if (build) {
              console.log('build', build.status);
              if (build.status === 'inProgress') {
                if (content.status !== 'running') {
                  startRumBuild(resourceName);
                }
              }

              if (build.status === 'completed') {
                if (content.status !== 'completed') {
                  completeRumBuild(resourceName);
                }
              }
            }

            console.log('currentBuildView', currentBuildView);

            if (currentBuildView === resourceName) {
              fetchBuildLogsDetails(
                buildMenagerState[currentBuildView].buildId,
              );
            }
          }),
      );
    };

    fetchBuilds();

    const interval = setInterval(() => {
      fetchBuilds();
    }, 5000);

    return () => clearInterval(interval);
  }, [buildMenagerState, currentBuildView, azureServiceBusApi]);

  return {
    loading,
    error,
    buildLogsDetails,
    currentBuildView,
    startRumBuild,
    changeCurrentBuildViewAndFetchLogs,
    buildMenagerState,
    completeRumBuild,
    triggerPipeline,
  };
};
