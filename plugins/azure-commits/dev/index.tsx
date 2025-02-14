import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { azureCommitsPlugin, AzureCommitsPage } from '../src/plugin';

createDevApp()
  .registerPlugin(azureCommitsPlugin)
  .addPage({
    element: <AzureCommitsPage />,
    title: 'Root Page',
    path: '/azure-commits',
  })
  .render();
