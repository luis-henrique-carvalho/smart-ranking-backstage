/* eslint-disable consistent-return */
import { useEffect, useRef, useState } from 'react';
import { AzureServiceBusApiRef } from '../api';
import { useApi } from '@backstage/core-plugin-api';
import {
  BuildItemType,
  BuildLogDetailsType,
  PipelineParamsType,
} from '../types';

export interface useAzurePipelineRunnerReturn {
  loading: boolean;
  error: string | null;
  buildLogsDetails: BuildLogDetailsType[];
  buildMenagerState: Record<string, BuildItemType>;
  currentBuildView: string | null;
  triggerPipeline: (data: PipelineParamsType) => Promise<void>;
  changeCurrentBuildViewAndFetchLogs: (resourceName: string) => void;
  cancelBuild: (resourceName: string) => Promise<void>;
}

type BuildMenagerStateType = Record<string, BuildItemType>;

const LOCAL_STORAGE_KEY = 'azurePipelineQueueManager';

export const useAzurePipelineRunner = (): useAzurePipelineRunnerReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildLogsDetails, setBuildLogsDetails] = useState<
    BuildLogDetailsType[]
  >([]);
  const [currentBuildView, setCurrentBuildView] = useState<string | null>(null);
  const [buildMenagerState, setBuildMenagerState] =
    useState<BuildMenagerStateType>({});

  const logsRefByBuildId = useRef(new Map<string, number[]>());
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);

  useEffect(() => {
    const savedQueues = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedQueues) return;

    const queues: BuildMenagerStateType = JSON.parse(savedQueues);
    const filteredQueues = Object.fromEntries(
      Object.entries(queues).filter(
        ([_, item]) => Date.now() - item.timestamp < 86400000,
      ),
    );

    setBuildMenagerState(filteredQueues);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredQueues));
  }, []);

  const updateBuildState = (newBuild: BuildMenagerStateType) => {
    setBuildMenagerState(prevState => {
      const newState = { ...prevState, ...newBuild };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const startBuild = async (resourceName: string): Promise<void> => {
    const buildItem = buildMenagerState[resourceName];

    updateBuildState({
      [resourceName]: {
        ...buildItem,
        status: 'running',
      },
    });
  };

  const completeBuild = async (resourceName: string): Promise<void> => {
    const buildItem = buildMenagerState[resourceName];

    updateBuildState({
      [resourceName]: {
        ...buildItem,
        status: 'completed',
      },
    });
  };

  const clearLogsForResource = (resourceName: string) => {
    setBuildLogsDetails([]);
    logsRefByBuildId.current.delete(resourceName);
  };

  const fetchBuildLogsDetails = async (
    buildId: number,
    resourceName: string,
  ) => {
    try {
      const logs = await azureServiceBusApi.fetchBuildLogs(buildId);

      if (logs?.value?.length) {
        const detailedLogs = await Promise.all(
          logs.value.map(log => {
            const existingLogs =
              logsRefByBuildId.current.get(resourceName) || [];

            if (!existingLogs.includes(log.id)) {
              logsRefByBuildId.current.set(resourceName, [
                ...existingLogs,
                log.id,
              ]);
              return azureServiceBusApi.fetchLogById(log.id, buildId);
            }

            return null;
          }),
        );

        const filteredLogs = detailedLogs.filter(
          log => log !== null,
        ) as BuildLogDetailsType[];

        if (filteredLogs.length > 0) {
          setBuildLogsDetails(prev => [...prev, ...filteredLogs]);
        }
      }
    } catch (err) {
      setError('Erro ao buscar logs');
    }
  };

  const changeCurrentBuildViewAndFetchLogs = (resourceName: string) => {
    clearLogsForResource(resourceName);
    setCurrentBuildView(resourceName);

    if (buildMenagerState[resourceName]) {
      fetchBuildLogsDetails(
        buildMenagerState[resourceName].buildId,
        resourceName,
      );
    }
  };

  const triggerPipeline = async (data: PipelineParamsType): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const build = await azureServiceBusApi.triggerPipeline(data);

      clearLogsForResource(data.resource_name);
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

  const cancelBuild = async (resourceName: string) => {
    setLoading(true);
    setError(null);

    const buildItem = buildMenagerState[resourceName];

    if (buildItem.status !== 'completed') {
      try {
        await azureServiceBusApi.cancelBuild(buildItem.buildId);

        completeBuild(resourceName);
      } catch (err) {
        setError('Erro ao cancelar build');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (
      !Object.values(buildMenagerState).some(
        q => q.status === 'queued' || q.status === 'running',
      )
    ) {
      return;
    }

    const fetchBuilds = async () => {
      try {
        await Promise.all(
          Object.entries(buildMenagerState)
            .filter(([, q]) => q.status === 'queued' || q.status === 'running')
            .map(async ([resourceName, content]) => {
              const buildResp = await azureServiceBusApi.fetchBuildById(
                content.buildId,
              );

              if (!buildResp) {
                return;
              }

              const isInProgress = buildResp.status === 'inProgress';
              const isCompleted = buildResp.status === 'completed';

              if (isInProgress && content.status !== 'running') {
                startBuild(resourceName);
              }

              if (isCompleted && content.status !== 'completed') {
                completeBuild(resourceName);
              }

              if (currentBuildView === resourceName) {
                fetchBuildLogsDetails(content.buildId, resourceName);
              }
            }),
        );
      } catch (err) {
        setError('Erro ao buscar builds');
      }
    };

    fetchBuilds();

    const interval = setInterval(() => {
      fetchBuilds();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildMenagerState, currentBuildView, azureServiceBusApi]);

  return {
    loading,
    error,
    buildLogsDetails,
    currentBuildView,
    changeCurrentBuildViewAndFetchLogs,
    buildMenagerState,
    triggerPipeline,
    cancelBuild,
  };
};
