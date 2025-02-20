import { AuthService, LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { AzureDevOpsService } from './types';

export async function createAzureDevOpsService({
  auth,
  logger,
  catalog,
}: {
  auth: AuthService;
  logger: LoggerService;
  catalog: typeof catalogServiceRef.T;
}): Promise<AzureDevOpsService> {
  logger.info('Initializing AzureDevOpsService');

  return {
    async listReleasePipelines() {
      return { items: [] };
    },
  };
}
