import { createExampleAction } from './azure-create-release-pipline';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import api from '../config/api';

jest.mock('../config/api');

describe('createReleasePiplineAction', () => {
  const mockPost = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    api.get = mockGet;
    api.post = mockPost;
  });

  it('should create release pipeline in Azure DevOps repository without reference', async () => {
    const input = {
      name: 'Test Pipeline',
      project: { name: 'Test Project', id: '123' },
      organization: 'test-org',
      decription: 'Test Description',
      withReference: false,
      repository: { name: 'Test Repo', id: '456' },
    };

    mockPost.mockResolvedValueOnce({
      status: 200,
      data: {
        id: 'def123',
        _links: {
          web: {
            href: 'https://dev.azure.com/test-org/Test Project/_release?releaseId=def123',
          },
        },
      },
    });

    mockPost.mockResolvedValueOnce({
      status: 200,
      data: {
        id: 'rel123',
        _links: {
          web: {
            href: 'https://dev.azure.com/test-org/TestProject/_release?releaseId=rel123',
          },
        },
      },
    });

    const ctx = createMockActionContext({ input });

    const action = createExampleAction();
    await action.handler(ctx);

    expect(mockPost).toHaveBeenCalledTimes(2);

    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      '/test-org/Test Project/_apis/release/definitions?api-version=7.1',
      {
        name: 'Test Pipeline',
        environments: expect.any(Array),
        artifacts: expect.any(Array),
      },
    );

    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      '/test-org/Test Project/_apis/release/releases?api-version=7.1',
      {
        definitionId: 'def123',
        description: 'Test Description',
        artifacts: [
          {
            alias: '_Test Repo',
            instanceReference: {
              id: 'master',
              name: 'master',
            },
          },
        ],
        isDraft: false,
      },
    );

    expect(ctx.output).toHaveBeenCalledWith('releaseId', 'rel123');
    expect(ctx.output).toHaveBeenCalledWith(
      'releaseUrl',
      'https://dev.azure.com/test-org/TestProject/_release?releaseId=rel123',
    );
  });

  it('should create release pipeline in Azure DevOps repository with reference', async () => {
    const input = {
      name: 'Test Pipeline',
      project: { name: 'Test Project', id: '123' },
      organization: 'test-org',
      decription: 'Test Description',
      withReference: true,
      reference: 'ref123',
    };

    mockGet.mockResolvedValueOnce({
      status: 200,
      data: {
        environments: [{ name: 'Reference Environment' }],
        artifacts: [
          {
            alias: 'refArtifact',
            type: 'Git',
            definitionReference: {
              branches: { id: 'refBranchId', name: 'refBranchName' },
              definition: { id: 'refDefId', name: 'refDefName' },
              project: { id: '123', name: 'Test Project' },
            },
          },
        ],
      },
    });

    mockPost.mockResolvedValueOnce({
      status: 200,
      data: {
        id: 'def123',
        _links: {
          web: {
            href: 'https://dev.azure.com/test-org/Test Project/_release?releaseId=def123',
          },
        },
      },
    });

    mockPost.mockResolvedValueOnce({
      status: 200,
      data: {
        id: 'rel123',
        _links: {
          web: {
            href: 'https://dev.azure.com/test-org/TestProject/_release?releaseId=rel123',
          },
        },
      },
    });

    const ctx = createMockActionContext({ input });

    const action = createExampleAction();
    await action.handler(ctx);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(2);

    expect(mockGet).toHaveBeenCalledWith(
      '/test-org/Test Project/_apis/release/definitions/ref123?api-version=7.1',
    );

    expect(mockPost).toHaveBeenNthCalledWith(
      1,
      '/test-org/Test Project/_apis/release/definitions?api-version=7.1',
      {
        name: 'Test Pipeline',
        environments: [{ name: 'Reference Environment' }],
        artifacts: [
          {
            alias: 'refArtifact',
            type: 'Git',
            definitionReference: {
              branches: { id: 'refBranchId', name: 'refBranchName' },
              definition: { id: 'refDefId', name: 'refDefName' },
              project: { id: '123', name: 'Test Project' },
            },
          },
        ],
      },
    );

    expect(mockPost).toHaveBeenNthCalledWith(
      2,
      '/test-org/Test Project/_apis/release/releases?api-version=7.1',
      {
        definitionId: 'def123',
        description: 'Test Description',
        artifacts: [
          {
            alias: 'refArtifact',
            instanceReference: {
              id: 'refBranchId',
              name: 'refBranchName',
            },
          },
        ],
        isDraft: false,
      },
    );

    expect(ctx.output).toHaveBeenCalledWith('releaseId', 'rel123');
    expect(ctx.output).toHaveBeenCalledWith(
      'releaseUrl',
      'https://dev.azure.com/test-org/TestProject/_release?releaseId=rel123',
    );
  });
});
