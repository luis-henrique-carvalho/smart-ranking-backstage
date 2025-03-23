import { useEffect, useRef, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../api';
import { Build, BuildLog, BuildLogFull, PipelineParams } from '../types';

export interface UseAzureServiceBusApiReturn {
  loading: boolean;
  pipelineRunId: number | null;
  build: Build | null;
  buildLogs: BuildLog[] | null;
  buildLogsFull: BuildLogFull[] | null;
  triggerPipeline: (data: PipelineParams) => Promise<void>;
}

export const useAzureServiceBusApi = (): UseAzureServiceBusApiReturn => {
  const [loading, setLoading] = useState(false);
  const [pipelineRunId, setPipelineRunId] = useState<number | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [buildLogs, setBuildLogs] = useState<BuildLog[]>([]);
  const [buildLogsFull, setBuildLogsFull] = useState<BuildLogFull[]>([]);
  const logsRef = useRef(new Set<number>()); // Armazena logs já processados
  const azureServiceBusApi = useApi(AzureServiceBusApiRef);

  const triggerPipeline = async (data: PipelineParams): Promise<void> => {
    setLoading(true);
    try {
      const response = await azureServiceBusApi.triggerPipeline(data);
      setPipelineRunId(response.id);
      setBuild(response);
      setBuildLogs([]);
      setBuildLogsFull([]);
      logsRef.current.clear();
    } catch (err) {
      console.error('Erro ao iniciar pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  // Polling para buscar status do build
  useEffect(() => {
    if (!pipelineRunId) return;
    console.log('🚀 Iniciando polling para status do build:', pipelineRunId);

    const fetchBuildStatus = async () => {
      try {
        const buildStatus = await azureServiceBusApi.fetchBuildById(
          pipelineRunId,
        );
        console.log('🔄 Status do Build:', buildStatus.status);
        setBuild(buildStatus);

        // Para o polling se o build estiver completo
        if (buildStatus.status === 'completed') {
          console.log('✅ Build finalizado, parando polling.');
          clearInterval(statusPolling);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar status do build:', err);
      }
    };

    // Polling para status do build a cada 5 segundos
    const statusPolling = setInterval(fetchBuildStatus, 5000);
    fetchBuildStatus(); // Chamada inicial

    return () => clearInterval(statusPolling); // Limpeza ao desmontar
  }, [pipelineRunId]);

  // Polling para buscar logs SOMENTE se o build estiver em execução
  useEffect(() => {
    if (!pipelineRunId || !build || build.status !== 'inProgress') return;
    console.log('📜 Iniciando polling para logs...');

    const fetchLogs = async () => {
      try {
        const logs = await azureServiceBusApi.fetchBuildLogs(pipelineRunId);
        console.log('📜 Logs obtidos:', logs);

        if (logs?.value?.length) {
          setBuildLogs(logs.value);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar logs:', err);
      }
    };

    // Polling para logs a cada 5 segundos
    const logPolling = setInterval(fetchLogs, 5000);
    fetchLogs(); // Chamada inicial

    return () => clearInterval(logPolling); // Limpeza ao desmontar
  }, [pipelineRunId, build]); // 🚀 Executa sempre que o `build.status` mudar

  // Buscar detalhes dos logs apenas quando `buildLogs` mudar
  useEffect(() => {
    if (!buildLogs.length) return;
    console.log('📌 Buscando detalhes dos logs:', buildLogs);

    const fetchLogDetails = async () => {
      try {
        const logsDetalhados = await Promise.all(
          buildLogs.map(async log => {
            if (!logsRef.current.has(log.id)) {
              logsRef.current.add(log.id);
              return azureServiceBusApi.fetchLogById(log.id, pipelineRunId!);
            }
            return null;
          }),
        );

        const filteredLogs = logsDetalhados.filter(
          log => log !== null,
        ) as BuildLogFull[];
        if (filteredLogs.length > 0) {
          setBuildLogsFull(prev => [...prev, ...filteredLogs]);
        }
      } catch (err) {
        console.error('❌ Erro ao buscar detalhes dos logs:', err);
      }
    };

    fetchLogDetails();
  }, [buildLogs]);

  return {
    loading,
    pipelineRunId,
    build,
    buildLogs,
    buildLogsFull,
    triggerPipeline,
  };
};
