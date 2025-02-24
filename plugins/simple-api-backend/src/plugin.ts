import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { createAplicationService } from './services/AplicationService';

/**
 * simpleApiPlugin backend plugin
 *
 * @public
 */
export const simpleApiPlugin = createBackendPlugin({
  pluginId: 'simple-api',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, httpRouter }) {
        const aplicationService = await createAplicationService({
          logger,
        });

        httpRouter.use(
          await createRouter({
            aplicationService,
          }),
        );
      },
    });
  },
});
