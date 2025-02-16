import {
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  configApiRef,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { AzureCommitsApiRef, AzureCommitsApiClient } from './api';

export const azureCommitsPlugin = createPlugin({
  id: 'azure-commits',
  apis: [
    createApiFactory({
      api: AzureCommitsApiRef,
      deps: { discoveryApi: discoveryApiRef, configApi: configApiRef },
      factory: ({ discoveryApi, configApi }) =>
        new AzureCommitsApiClient({ discoveryApi, configApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const AzureCommitsPage = azureCommitsPlugin.provide(
  createRoutableExtension({
    name: 'AzureCommitsPage',
    component: () =>
      import('./components/AzureCommitsContent').then(
        m => m.AzureCommitsContent,
      ),
    mountPoint: rootRouteRef,
  }),
);
