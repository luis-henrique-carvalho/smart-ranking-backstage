import { ConfigApi, createApiRef } from '@backstage/core-plugin-api';
import { PipelineParams } from '../types';

export const AzureServiceBusApiRef = createApiRef<AzureServiceBusApi>({
  id: 'plugin.azure-service-bus.service',
});

export interface BuildLog {
  lineCount: number;
  createdOn: string;
  lastChangedOn: string;
  id: number;
  type: string;
  url: string;
}

export interface BuildLogsResponse {
  count: number;
  value: BuildLog[];
}

export interface AzureServiceBusApi {
  triggerPipeline(pipeline_params: PipelineParams): Promise<any>;
  fetchBuildLogs(pipelineRunId: number): Promise<BuildLogsResponse>;
  fetchLogByid(logId: number, build_id: number): Promise<BuildLog>;
  fetchBuildById(buildId: number): Promise<any | null>;
}

export class AzureServiceBusApiClient implements AzureServiceBusApi {
  private readonly configApi: ConfigApi;
  private readonly token: string | undefined;
  private readonly piplineUrl: string | undefined;

  constructor(options: { configApi: ConfigApi }) {
    this.configApi = options.configApi;
    this.token = this.configApi.getOptionalString(
      'plugins.azureServiceBus.piplineToken',
    );
    this.piplineUrl = this.configApi.getOptionalString(
      'plugins.azureServiceBus.piplineUrl',
    );

    if (!this.piplineUrl) {
      throw new Error(
        'Configuração "plugins.azureServiceBus.piplineUrl" ausente no app-config.yaml.',
      );
    }

    if (!this.token) {
      throw new Error(
        'Atenção: "plugins.azureServiceBus.piplineToken" está ausente no app-config.yaml.',
      );
    }
  }

  async fetchBuildLogs(buildId: number): Promise<BuildLogsResponse> {
    const organization = 'luishenrique92250483';
    const project = '164c4835-7cf1-4b19-956e-67c9fc006d71';

    const url = `https://dev.azure.com/${organization}/${project}/_apis/build/builds/${buildId}/logs?api-version=7.1`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) throw new Error(resp.statusText);

    return await resp.json();
  }

  async fetchBuildById(buildId: number): Promise<any | null> {
    const organization = 'luishenrique92250483';
    const project = '164c4835-7cf1-4b19-956e-67c9fc006d71';

    const url = `https://dev.azure.com/${organization}/${project}/_apis/build/builds/${buildId}?api-version=7.1`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) throw new Error(resp.statusText);

    return await resp.json();
  }

  async fetchLogByid(logId: number, build_id: number): Promise<any> {
    const organization = 'luishenrique92250483';
    const project = 'Pipiline%20com%20YAML';

    const url = `https://dev.azure.com/${organization}/${project}/_apis/build/builds/${build_id}/logs/${logId}?api-version=7.1`;

    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
    });

    if (!resp.ok) throw new Error(resp.statusText);

    return await resp.json();
  }

  async triggerPipeline(pipeline_params: PipelineParams): Promise<any> {
    const body = {
      previewRun: false,
      templateParameters: pipeline_params,
    };

    try {
      const resp = await fetch(this.piplineUrl!, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        throw new Error(`Erro na API: ${resp.status} - ${resp.statusText}`);
      }

      return resp.json();
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Falha ao disparar pipeline: ${error.message}`
          : `Erro desconhecido: ${String(error)}`,
      );
    }
  }
}
