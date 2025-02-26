import { scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { createScaffolderFieldExtension } from '@backstage/plugin-scaffolder-react';
import {
  AzureReleasePiplineSelector,
  AzureReleasePiplineSelectorValidation,
} from './AzureReleasePiplineSelector';

export const AzureReleasePiplineSelectorExtension = scaffolderPlugin.provide(
  createScaffolderFieldExtension({
    name: 'AzureReleasePiplineSelector',
    component: AzureReleasePiplineSelector,
    validation: AzureReleasePiplineSelectorValidation,
  }),
);
