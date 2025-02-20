import { HttpAuthService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { AzureDevOpsService } from './services/AzureDevOpsService/types';

export async function createRouter({
  httpAuth,
  azureDevOpsService,
}: {
  httpAuth: HttpAuthService;
  azureDevOpsService: AzureDevOpsService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/release-pipelines', async (req, res) => {
    const pipelines = await azureDevOpsService.listReleasePipelines();
    res.json(pipelines);
  });

  return router;
}
