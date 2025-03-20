import { ConfigApi, createApiRef } from '@backstage/core-plugin-api';
import { PipelineParams } from '../types';

export const AzureServiceBusApiRef = createApiRef<AzureServiceBusApi>({
  id: 'plugin.azure-service-bus.service',
});

export interface AzureServiceBusApi {
  triggerPipeline(pipeline_params: PipelineParams): Promise<any>;
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

      const responseBody = await resp.text();

      if (!resp.ok) {
        throw new Error(`Erro na API: ${resp.status} - ${resp.statusText}`);
      }

      return JSON.parse(responseBody);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Falha ao disparar pipeline: ${error.message}`
          : `Erro desconhecido: ${String(error)}`,
      );
    }
  }
}
