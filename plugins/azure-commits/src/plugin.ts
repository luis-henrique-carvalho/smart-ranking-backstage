import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const azureCommitsPlugin = createPlugin({
  id: 'azure-commits',
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
