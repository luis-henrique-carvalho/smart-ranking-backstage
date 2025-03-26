import { ConfigApi, createApiRef } from '@backstage/core-plugin-api';
import {
  BuildType,
  BuildLogDetailsType,
  BuildLogsResponse,
  PipelineParamsType,
} from '../types';

export const AzureServiceBusApiRef = createApiRef<AzureServiceBusApi>({
  id: 'plugin.azure-service-bus.service',
});

export interface AzureServiceBusApi {
  triggerPipeline(pipeline_params: PipelineParamsType): Promise<BuildType>;
  fetchBuildLogs(buildId: number): Promise<BuildLogsResponse>;
  fetchLogById(logId: number, buildId: number): Promise<BuildLogDetailsType>;
  fetchBuildById(buildId: number): Promise<BuildType | null>;
  cancelBuild(buildId: number): Promise<BuildType>;
}

export class AzureServiceBusApiClient implements AzureServiceBusApi {
  private readonly configApi: ConfigApi;
  private readonly token: string;
  private readonly pipelineUrl: string;
  private readonly organization = 'luishenrique92250483';
  private readonly project = '164c4835-7cf1-4b19-956e-67c9fc006d71';

  constructor(options: { configApi: ConfigApi }) {
    this.configApi = options.configApi;
    this.token =
      this.configApi.getOptionalString(
        'plugins.azureServiceBus.pipelineToken',
      ) || '';
    this.pipelineUrl =
      this.configApi.getOptionalString('plugins.azureServiceBus.pipelineUrl') ||
      '';

    if (!this.pipelineUrl) {
      throw new Error(
        'Configuração "plugins.azureServiceBus.pipelineUrl" ausente no app-config.yaml.',
      );
    }

    if (!this.token) {
      throw new Error(
        'Atenção: "plugins.azureServiceBus.pipelineToken" está ausente no app-config.yaml.',
      );
    }
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async fetchBuildLogs(buildId: number): Promise<BuildLogsResponse> {
    const url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/build/builds/${buildId}/logs?api-version=7.1`;

    return this.fetchFromAzure(url);
  }

  async fetchBuildById(buildId: number): Promise<BuildType | null> {
    const url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/build/builds/${buildId}?api-version=7.1`;

    return this.fetchFromAzure(url);
  }

  async fetchLogById(
    logId: number,
    buildId: number,
  ): Promise<BuildLogDetailsType> {
    const url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/build/builds/${buildId}/logs/${logId}?api-version=7.1`;

    return this.fetchFromAzure(url);
  }

  async cancelBuild(buildId: number): Promise<BuildType> {
    const url = `https://dev.azure.com/${this.organization}/${this.project}/_apis/build/builds/${buildId}?api-version=7.1`;

    try {
      const resp = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status: 'cancelling' }),
      });

      if (!resp.ok) {
        throw new Error(`Erro na API: ${resp.status} - ${resp.statusText}`);
      }

      const build = await resp.json();

      if (build.status !== 'cancelling') {
        throw new Error('Falha ao cancelar build');
      }

      return build;
    } catch (error) {
      throw new Error(`Falha ao cancelar build: ${this.formatError(error)}`);
    }
  }

  async triggerPipeline(
    pipeline_params: PipelineParamsType,
  ): Promise<BuildType> {
    if (!this.pipelineUrl) {
      throw new Error('Erro de configuração: "pipelineUrl" não foi definido.');
    }

    const body = JSON.stringify({
      previewRun: false,
      templateParameters: pipeline_params,
    });

    try {
      const resp = await fetch(this.pipelineUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body,
      });

      if (!resp.ok) {
        throw new Error(`Erro na API: ${resp.status} - ${resp.statusText}`);
      }

      return await resp.json();
    } catch (error) {
      throw new Error(`Falha ao disparar pipeline: ${this.formatError(error)}`);
    }
  }

  private async fetchFromAzure(url: string): Promise<any> {
    try {
      const resp = await fetch(url, { headers: this.getHeaders() });

      if (!resp.ok) {
        throw new Error(`Erro na API: ${resp.status} - ${resp.statusText}`);
      }

      return await resp.json();
    } catch (error) {
      throw new Error(`Erro na requisição: ${url}`);
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error
      ? error.message
      : `Erro desconhecido: ${String(error)}`;
  }
}
