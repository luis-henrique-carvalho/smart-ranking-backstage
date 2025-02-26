import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import { AzureDevOpsService } from './services/AzureDevOpsService/types';

describe('createRouter', () => {
  let app: express.Express;
  let azureDevOpsService: jest.Mocked<AzureDevOpsService>;

  beforeEach(async () => {
    azureDevOpsService = {
      listReleasePipelines: jest.fn(),
      listProjects: jest.fn(),
      listRepositories: jest.fn(),
    } as unknown as jest.Mocked<AzureDevOpsService>;

    const router = await createRouter({ azureDevOpsService });
    app = express();
    app.use(express.json());
    app.use(router);
  });

  it('should return OK for /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });

  it('should list release pipelines', async () => {
    azureDevOpsService.listReleasePipelines.mockResolvedValue({
      count: 2,
      value: [
        { id: '1', name: 'Pipeline 1' },
        { id: '2', name: 'Pipeline 2' },
      ],
    });

    const response = await request(app).get(
      '/release-pipelines/test-org/test-project',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      count: 2,
      value: [
        { id: '1', name: 'Pipeline 1' },
        { id: '2', name: 'Pipeline 2' },
      ],
    });
  });

  it('should return 404 if release pipelines are not found', async () => {
    azureDevOpsService.listReleasePipelines.mockRejectedValue(
      new Error('NotFoundError'),
    );

    const response = await request(app).get(
      '/release-pipelines/test-org/test-project',
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'NotFoundError' });
  });

  it('should list projects', async () => {
    azureDevOpsService.listProjects.mockResolvedValue({
      count: 2,
      value: [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ],
    });

    const response = await request(app).get('/projects/test-org');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      count: 2,
      value: [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' },
      ],
    });
  });

  it('should return 404 if projects are not found', async () => {
    azureDevOpsService.listProjects.mockRejectedValue(
      new Error('NotFoundError'),
    );

    const response = await request(app).get('/projects/test-org');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'NotFoundError' });
  });

  it('should list repositories', async () => {
    azureDevOpsService.listRepositories.mockResolvedValue({
      count: 2,
      value: [
        { id: '1', name: 'Repo 1' },
        { id: '2', name: 'Repo 2' },
      ],
    });

    const response = await request(app).get(
      '/repositories/test-org/test-project',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      count: 2,
      value: [
        { id: '1', name: 'Repo 1' },
        { id: '2', name: 'Repo 2' },
      ],
    });
  });

  it('should return 404 if repositories are not found', async () => {
    azureDevOpsService.listRepositories.mockRejectedValue(
      new Error('NotFoundError'),
    );

    const response = await request(app).get(
      '/repositories/test-org/test-project',
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'NotFoundError' });
  });

  it('should return 500 for internal server errors', async () => {
    azureDevOpsService.listRepositories.mockRejectedValue(
      new Error('Internal Server Error'),
    );

    const response = await request(app).get(
      '/repositories/test-org/test-project',
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal Server Error' });
  });
});
