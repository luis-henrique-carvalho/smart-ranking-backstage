import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import {
  AzureRepositorySelector,
  AzureRepositorySelectorValidation,
} from './AzureRepositorySelector';

export const AzureRepositorySelectorExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'AzureRepositorySelector',
    component: AzureRepositorySelector,
    validation: AzureRepositorySelectorValidation,
  }),
);
