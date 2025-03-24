import { useEffect, useRef, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../api';
import { Build, BuildLog, BuildLogFull, PipelineParams } from '../types';

type ResourceType = 'queue' | 'topic';
type BuildStatus = 'inProgress' | 'completed' | 'failed' | 'canceled';

interface BuildItem {
  resourceName: string;
  resourceType: ResourceType;
  buildId: number;
  status: BuildStatus;
  timestamp: number;
  webUrl?: string;
}

export interface useAzurePipelineRunnerReturn {
  loading: boolean;
  activeBuildId: number | null;
  build: Build | null;
  buildLogs: BuildLog[];
  buildLogsDetails: BuildLogFull[];
  error: string | null;
  setError: (message: string | null) => void;
  buildsHistory: BuildItem[];
  trackBuild: (buildId: number) => void;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
  clearBuild: () => void;
  clearHistory: () => void;
}

const HISTORY_KEY = 'azurePipelineBuildsHistory';

export const useAzurePipelineRunner = (): useAzurePipelineRunnerReturn => {
  const [loading, setLoading] = useState(false);
  const [activeBuildId, setActiveBuildId] = useState<number | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [buildLogsDetails, setBuildLogsDetails] = useState<BuildLogFull[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buildsHistory, setBuildsHistory] = useState<BuildItem[]>([]);
  const logsRef = useRef(new Set<number>());
  const pollingRef = useRef<NodeJS.Timeout>();
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);

  const updateBuildStatus = (buildId: number, status: BuildStatus) => {
    setBuildsHistory(prev => {
      const updated = prev.map(item =>
        item.buildId === buildId ? { ...item, status } : item,
      );
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const addNewBuild = (newBuild: BuildItem) => {
    setBuildsHistory(prev => {
      const updated = [...prev, newBuild];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const fetchBuildData = async (buildId: number) => {
    try {
      const currentBuild = await azureServiceBusApi.fetchBuildById(buildId);
      if (!currentBuild) {
        throw new Error('Build not found');
      }

      const logs = await azureServiceBusApi.fetchBuildLogs(buildId);

      // Convert Azure DevOps status to our BuildStatus type
      const statusMap: Record<string, BuildStatus> = {
        inProgress: 'inProgress',
        completed: 'completed',
        cancelling: 'canceled',
        cancelled: 'canceled',
        failed: 'failed',
      };

      const mappedStatus = statusMap[currentBuild.status];

      setBuild(currentBuild);
      setBuildLogs(logs.value || []);
      updateBuildStatus(buildId, mappedStatus);

      if (logs.value?.length) {
        const detailedLogs = await Promise.all(
          logs.value.map(async log => {
            if (!logsRef.current.has(log.id)) {
              logsRef.current.add(log.id);
              return azureServiceBusApi.fetchLogById(log.id, buildId);
            }
            return null;
          }),
        );

        const filteredLogs = detailedLogs.filter(Boolean) as BuildLogFull[];
        if (filteredLogs.length) {
          setBuildLogsDetails(prev => [...prev, ...filteredLogs]);
        }
      }

      return mappedStatus;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch build data',
      );
      throw err;
    }
  };

  const startPolling = (buildId: number) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const status = await fetchBuildData(buildId);
        if (status !== 'inProgress') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
        }
      } catch (err) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      }
    }, 5000);
  };

  const trackBuild = async (buildId: number) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setActiveBuildId(buildId);
    setLoading(true);
    setError(null);

    try {
      await fetchBuildData(buildId);
      startPolling(buildId);
    } catch (err) {
      setError('Failed to fetch build data');
    } finally {
      setLoading(false);
    }
  };

  const triggerPipeline = async (data: PipelineParams): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await azureServiceBusApi.triggerPipeline(data);

      const newBuild: BuildItem = {
        resourceName: data.resource_name,
        resourceType: data.resource_type,
        buildId: response.id,
        status: 'inProgress',
        timestamp: Date.now(),
        webUrl: response._links?.web?.href,
      };

      addNewBuild(newBuild);
      await trackBuild(response.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to trigger pipeline',
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearBuild = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setActiveBuildId(null);
    setBuild(null);
    setBuildLogs([]);
    setBuildLogsDetails([]);
    logsRef.current.clear();
  };

  const clearHistory = () => {
    setBuildsHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  // Carrega histórico e limpa builds antigos
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      // Mantém apenas builds dos últimos 7 dias
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const filteredHistory = history.filter(
        (b: BuildItem) => b.timestamp > oneWeekAgo,
      );
      setBuildsHistory(filteredHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  return {
    loading,
    activeBuildId,
    build,
    buildLogs,
    buildLogsDetails,
    error,
    buildsHistory,
    setError,
    trackBuild,
    triggerPipeline,
    clearBuild,
    clearHistory,
  };
};
