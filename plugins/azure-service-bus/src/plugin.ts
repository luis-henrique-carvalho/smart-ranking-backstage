import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  configApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { AzureServiceBusApiRef, AzureServiceBusApiClient } from './api';

export const azureServiceBusPlugin = createPlugin({
  id: 'azure-service-bus',
  apis: [
    createApiFactory({
      api: AzureServiceBusApiRef,
      deps: {
        configApi: configApiRef,
      },
      factory: ({ configApi }) => new AzureServiceBusApiClient({ configApi }),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

export const AzureServiceBusPage = azureServiceBusPlugin.provide(
  createRoutableExtension({
    name: 'AzureServiceBusPage',
    component: () =>
      import('./components/AzureServiceBusContent').then(
        m => m.AzureServiceBusContent,
      ),
    mountPoint: rootRouteRef,
  }),
);
