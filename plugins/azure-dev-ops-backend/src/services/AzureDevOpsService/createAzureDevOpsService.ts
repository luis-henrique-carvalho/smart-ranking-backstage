import { LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { AzureDevOpsService } from './types';
import ApiClient from '../../config/api';

export async function createAzureDevOpsService({
  logger,
  catalog,
}: {
  logger: LoggerService;
  catalog: typeof catalogServiceRef.T;
}): Promise<AzureDevOpsService> {
  logger.info('Initializing AzureDevOpsService');

  const releaseApiClient = new ApiClient(
    process.env.AZURE_RELEASE_URL as string,
  );
  const azureApiClient = new ApiClient(process.env.AZURE_URL as string);

  const releaseApi = releaseApiClient.getClient();
  const azureApi = azureApiClient.getClient();

  return {
    async listReleasePipelines(organization, projectName) {
      try {
        const response = await releaseApi.get(
          `/${organization}/${projectName}/_apis/release/definitions?api-version=7.0`,
        );

        logger.info('Listed release pipelines');

        return response.data;
      } catch (error) {
        console.log(error);
        throw new NotFoundError('Failed to list release pipelines');
      }
    },

    async listProjects(organization) {
      console.log('organization', organization);
      try {
        const response = await azureApi.get(
          `/${organization}/_apis/projects?api-version=7.1`,
        );

        logger.info('Listed projects');

        return response.data;
      } catch (error) {
        console.log(error);
        throw new NotFoundError('Failed to list projects');
      }
    },

    async listRepositories(organization, projectName) {
      try {
        const response = await azureApi.get(
          `/${organization}/${projectName}/_apis/git/repositories?api-version=7.1`,
        );

        logger.info('Listed repositories');

        return response.data;
      } catch (error) {
        logger.error(`Failed to list repositories${error}`);
        throw new NotFoundError('Failed to list repositories');
      }
    },
  };
}
