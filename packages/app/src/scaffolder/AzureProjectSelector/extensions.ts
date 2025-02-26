import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import {
  AzureProjectSelector,
  AzureProjectSelectorValidation,
} from './AzureProjectSelector';

export const AzureProjectSelectorExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'AzureProjectSelector',
    component: AzureProjectSelector,
    validation: AzureProjectSelectorValidation,
  }),
);
