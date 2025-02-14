import { createAzureBranchAction } from './create-azure-branch';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import api from '../config/api';

jest.mock('../config/api');

describe('createAzureBranchAction', () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    api.get = mockGet;
    api.post = mockPost;
  });

  it('should create branches in Azure DevOps repository', async () => {
    const action = createAzureBranchAction();

    mockGet.mockResolvedValue({
      status: 200,
      data: {
        value: [{ objectId: '123' }],
      },
    });

    const mockContext = createMockActionContext({
      input: {
        repository: 'my-repo',
        organization: 'my-org',
        project: 'my-project',
        branchNames: ['branch-1', 'branch-2'],
      },
    });

    await action.handler(mockContext);

    expect(mockGet).toHaveBeenCalledWith(
      '/my-org/my-project/_apis/git/repositories/my-repo/refs?api-version=7.1-preview.1',
    );

    expect(mockPost).toHaveBeenCalledWith(
      '/my-org/my-project/_apis/git/repositories/my-repo/refs?api-version=7.1-preview.1',
      expect.arrayContaining([
        expect.objectContaining({
          name: 'refs/heads/branch-1',
          oldObjectId: '0000000000000000000000000000000000000000',
          newObjectId: '123',
        }),
        expect.objectContaining({
          name: 'refs/heads/branch-2',
          oldObjectId: '0000000000000000000000000000000000000000',
          newObjectId: '123',
        }),
      ]),
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if repository does not exist', async () => {
    const action = createAzureBranchAction();

    mockGet.mockResolvedValue({
      data: {
        value: [],
      },
    });

    const mockContext = createMockActionContext({
      input: {
        repository: 'my-repo',
        organization: 'my-org',
        project: 'my-project',
        branchNames: ['branch-1', 'branch-2'],
      },
    });

    await expect(action.handler(mockContext)).rejects.toThrow(
      'Failed to create branches',
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(0);
  });

  it('should throw an error if API call fails', async () => {
    const action = createAzureBranchAction();

    mockGet.mockRejectedValue(new Error('API call failed'));

    const mockContext = createMockActionContext({
      input: {
        repository: 'my-repo',
        organization: 'my-org',
        project: 'my-project',
        branchNames: ['branch-1', 'branch-2'],
      },
    });

    await expect(action.handler(mockContext)).rejects.toThrow(
      'Failed to create branches',
    );

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(0);
  });
});
