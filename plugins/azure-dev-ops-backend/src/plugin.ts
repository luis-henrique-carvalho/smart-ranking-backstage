import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { createAzureDevOpsService } from './services/AzureDevOpsService';

/**
 * azureDevOpsPlugin backend plugin
 *
 * @public
 */
export const azureDevOpsPlugin = createBackendPlugin({
  pluginId: 'azure-dev-ops',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
      },
      async init({ logger, httpRouter, catalog }) {
        const azureDevOpsService = await createAzureDevOpsService({
          logger,
          catalog,
        });

        httpRouter.use(
          await createRouter({
            azureDevOpsService,
          }),
        );

        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        httpRouter.addAuthPolicy({
          path: '/release-pipelines',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
