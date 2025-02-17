import { createExampleAction } from './create-azure-commit';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import api from '../config/api';

jest.mock('../config/api');

describe('createExampleAction', () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    api.get = mockGet;
    api.post = mockPost;
  });

  it('should commit multiple files to Azure DevOps repository', async () => {
    const action = createExampleAction();

    const mockContext = createMockActionContext({
      input: {
        organization: 'my-org',
        project: 'my-project',
        repository: 'my-repo',
        fileList: [
          {
            filePath: 'file1.txt',
            fileType: 'txt',
            content: 'Hello, world!',
          },
          {
            filePath: 'file2.json',
            fileType: 'json',
            content: '{"key": "value"}',
          },
        ],
        branch: 'main',
      },
    });

    mockGet.mockResolvedValue({
      status: 200,
      data: {
        value: [{ objectId: '12345' }],
      },
    });

    mockPost.mockResolvedValue({
      status: 201,
    });

    await action.handler(mockContext);

    expect(mockGet).toHaveBeenCalledWith(
      '/my-org/my-project/_apis/git/repositories/my-repo/refs?api-version=7.1-preview.1',
    );
    expect(mockPost).toHaveBeenCalledWith(
      '/my-org/my-project/_apis/git/repositories/my-repo/pushes?api-version=6.0',
      expect.any(String),
    );
  });

  it('should throw an error if fetching repository reference fails', async () => {
    const action = createExampleAction();

    const mockContext = createMockActionContext({
      input: {
        organization: 'my-org',
        project: 'my-project',
        repository: 'my-repo',
        fileList: [
          {
            filePath: 'file1.txt',
            fileType: 'txt',
            content: 'Hello, world!',
          },
          {
            filePath: 'file2.json',
            fileType: 'json',
            content: '{"key": "value"}',
          },
        ],
        branch: 'main',
      },
    });

    mockGet.mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
    });

    await expect(action.handler(mockContext)).rejects.toThrow(
      'Failed to fetch repository reference: 404 - Not Found',
    );
  });

  it('should throw an error if committing changes fails', async () => {
    const action = createExampleAction();

    const mockContext = createMockActionContext({
      input: {
        organization: 'my-org',
        project: 'my-project',
        repository: 'my-repo',
        fileList: [
          {
            filePath: 'file1.txt',
            fileType: 'txt',
            content: 'Hello, world!',
          },
          {
            filePath: 'file2.json',
            fileType: 'json',
            content: '{"key": "value"}',
          },
        ],
        branch: 'main',
      },
    });

    mockGet.mockResolvedValue({
      status: 200,
      data: {
        value: [{ objectId: '12345' }],
      },
    });

    mockPost.mockResolvedValue({
      status: 400,
      statusText: 'Bad Request',
    });

    await expect(action.handler(mockContext)).rejects.toThrow(
      'Failed to commit changes: 400 - Bad Request',
    );
  });
});
