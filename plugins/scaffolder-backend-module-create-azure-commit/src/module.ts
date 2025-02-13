import { createBackendModule } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createExampleAction } from './actions/create-azure-commit';

/**
 * A backend module that registers the action into the scaffolder
 */
export const scaffolderModule = createBackendModule({
  moduleId: 'create-azure-commit',
  pluginId: 'scaffolder',
  register({ registerInit }) {
    registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
      },
      async init({ scaffolderActions }) {
        scaffolderActions.addActions(createExampleAction());
      },
    });
  },
});
