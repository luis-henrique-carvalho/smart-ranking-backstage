import express from 'express';
import Router from 'express-promise-router';
import { AzureDevOpsService } from './services/AzureDevOpsService/types';

export async function createRouter({
  azureDevOpsService,
}: {
  azureDevOpsService: AzureDevOpsService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/health', async (_req, res) => {
    res.send('OK');
  });

  router.get('/release-pipelines/:organization/:project', async (req, res) => {
    try {
      const pipelines = await azureDevOpsService.listReleasePipelines(
        req.params.organization,
        req.params.project,
      );
      res.json(pipelines);
    } catch (error: any) {
      if (error.message === 'NotFoundError') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  router.get('/projects/:organization', async (req, res) => {
    try {
      const projects = await azureDevOpsService.listProjects(
        req.params.organization,
      );
      res.json(projects);
    } catch (error: any) {
      if (error.message === 'NotFoundError') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  router.get('/repositories/:organization/:project', async (req, res) => {
    try {
      const repositories = await azureDevOpsService.listRepositories(
        req.params.organization,
        req.params.project,
      );
      res.json(repositories);
    } catch (error: any) {
      if (error.message === 'NotFoundError') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  return router;
}
