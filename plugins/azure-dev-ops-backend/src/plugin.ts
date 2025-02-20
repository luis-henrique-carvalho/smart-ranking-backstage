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
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        catalog: catalogServiceRef,
      },
      async init({ logger, auth, httpAuth, httpRouter, catalog }) {
        const azureDevOpsService = await createAzureDevOpsService({
          logger,
          auth,
          catalog,
        });

        httpRouter.use(
          await createRouter({
            httpAuth,
            azureDevOpsService,
          }),
        );
      },
    });
  },
});
