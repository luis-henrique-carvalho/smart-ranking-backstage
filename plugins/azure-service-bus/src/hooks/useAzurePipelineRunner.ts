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
  buildManagerState: Record<string, BuildItemType>;
  currentBuildView: string | null;
  triggerPipeline: (data: PipelineParamsType) => Promise<void>;
  changeCurrentBuildViewAndFetchLogs: (resourceName: string) => Promise<void>;
  cancelBuild: (resourceName: string) => Promise<void>;
  completeBuild: (resourceName: string) => Promise<void>;
  startBuild: (resourceName: string) => Promise<void>;
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
  const [buildManagerState, setBuildManagerState] =
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

    setBuildManagerState(filteredQueues);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredQueues));
  }, []);

  const updateBuildState = (newBuild: BuildMenagerStateType) => {
    setBuildManagerState(prevState => {
      const newState = { ...prevState, ...newBuild };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  const startBuild = async (resourceName: string): Promise<void> => {
    const buildItem = buildManagerState[resourceName];

    updateBuildState({
      [resourceName]: {
        ...buildItem,
        status: 'running',
      },
    });
  };

  const completeBuild = async (resourceName: string): Promise<void> => {
    const buildItem = buildManagerState[resourceName];

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
  ): Promise<void> => {
    try {
      const logs = await azureServiceBusApi.fetchBuildLogs(buildId);

      if (logs?.value?.length) {
        const promises = logs.value.flatMap(log => {
          const existingLogs = logsRefByBuildId.current.get(resourceName) || [];

          if (!existingLogs.includes(log.id)) {
            logsRefByBuildId.current.set(resourceName, [
              ...existingLogs,
              log.id,
            ]);
            return [azureServiceBusApi.fetchLogById(log.id, buildId)];
          }

          return [];
        });

        const detailedLogs = await Promise.all(promises);

        if (detailedLogs.length > 0) {
          setBuildLogsDetails(prev => [...prev, ...detailedLogs]);
        }
      }
    } catch (err) {
      setError('Erro ao buscar logs');
    }
  };

  const changeCurrentBuildViewAndFetchLogs = async (
    resourceName: string,
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    clearLogsForResource(resourceName);
    setCurrentBuildView(resourceName);

    try {
      const buildItem = buildManagerState[resourceName];
      if (buildItem) {
        await fetchBuildLogsDetails(buildItem.buildId, resourceName);
      }
    } catch (err) {
      setError('Erro ao buscar logs');
    } finally {
      setLoading(false);
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelBuild = async (resourceName: string) => {
    setLoading(true);
    setError(null);

    const buildItem = buildManagerState[resourceName];

    if (buildItem.status !== 'completed') {
      try {
        await azureServiceBusApi.cancelBuild(buildItem.buildId);

        await completeBuild(resourceName);
      } catch (err) {
        setError('Erro ao cancelar build');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (
      !Object.values(buildManagerState).some(
        q => q.status === 'queued' || q.status === 'running',
      )
    ) {
      return;
    }

    const fetchBuilds = async () => {
      try {
        await Promise.all(
          Object.entries(buildManagerState)
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
                await startBuild(resourceName);
              }

              if (isCompleted && content.status !== 'completed') {
                await completeBuild(resourceName);
              }

              if (currentBuildView === resourceName) {
                await fetchBuildLogsDetails(content.buildId, resourceName);
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
  }, [buildManagerState, currentBuildView]);

  return {
    loading,
    error,
    buildLogsDetails,
    currentBuildView,
    changeCurrentBuildViewAndFetchLogs,
    buildManagerState,
    triggerPipeline,
    cancelBuild,
    completeBuild,
    startBuild,
  };
};
