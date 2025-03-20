import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { azureServiceBusPlugin, AzureServiceBusPage } from '../src/plugin';

createDevApp()
  .registerPlugin(azureServiceBusPlugin)
  .addPage({
    element: <AzureServiceBusPage />,
    title: 'Root Page',
    path: '/azure-service-bus',
  })
  .render();
