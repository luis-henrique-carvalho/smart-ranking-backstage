import { LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { AzureDevOpsService } from './types';
import api from '../../config/api';

export async function createAzureDevOpsService({
  logger,
  catalog,
}: {
  logger: LoggerService;
  catalog: typeof catalogServiceRef.T;
}): Promise<AzureDevOpsService> {
  logger.info('Initializing AzureDevOpsService');

  return {
    async listReleasePipelines() {
      const projectName = 'backstage';
      const org = 'luishenrique92250483';

      try {
        const response = await api.get(
          `${org}/${projectName}/_apis/release/definitions?api-version=7.0`,
        );

        console.log(response.data);

        return response.data;
      } catch (error) {
        console.log(error);
        throw new NotFoundError('Failed to list release pipelines');
      }
    },
  };
}
