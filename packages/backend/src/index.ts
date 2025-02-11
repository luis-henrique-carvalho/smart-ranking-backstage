/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-azure'));
backend.add(import('@backstage/plugin-techdocs-backend'));
backend.add(import('@backstage/plugin-events-backend'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-azure'));

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// kubernetes
backend.add(import('@backstage/plugin-kubernetes-backend'));

import { CATALOG_ERRORS_TOPIC } from '@backstage/plugin-catalog-backend';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { eventsServiceRef, EventParams } from '@backstage/plugin-events-node';

interface EventsPayload {
  entity: string;
  location?: string;
  errors: Error[];
}

interface EventsParamsWithPayload extends EventParams {
  eventPayload: EventsPayload;
}

const eventsModuleCatalogErrors = createBackendModule({
  pluginId: 'events',
  moduleId: 'catalog-errors',
  register(env) {
    env.registerInit({
      deps: {
        events: eventsServiceRef,
        logger: coreServices.logger,
      },
      async init({ events, logger }) {
        events.subscribe({
          id: 'catalog',
          topics: [CATALOG_ERRORS_TOPIC],
          async onEvent(params: EventParams): Promise<void> {
            const event = params as EventsParamsWithPayload;
            const { entity, location, errors } = event.eventPayload;
            // Add custom logic here for responding to errors
            for (const error of errors) {
              logger.warn(error.message, {
                entity,
                location,
              });
            }
          },
        });
      },
    });
  },
});

backend.add(eventsModuleCatalogErrors);

backend.add(import('backstage-plugin-scaffolder-backend-module-create-azure-branch'));
backend.start();
