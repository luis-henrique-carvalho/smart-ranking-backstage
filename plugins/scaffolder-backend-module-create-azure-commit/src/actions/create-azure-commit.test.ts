import { createExampleAction } from './create-azure-commit';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

describe('createExampleAction', () => {
  it('should call action', async () => {
    const action = createExampleAction();

    await expect(
      action.handler(
        createMockActionContext({
          input: {
            organization: 'test',
            project: 'test',
            repository: 'test',
            branch: 'test',
            filePath: 'test',
          },
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it('should fail when passing foo', async () => {
    const action = createExampleAction();

    await expect(
      action.handler(
        createMockActionContext({
          input: {
            organization: 'test',
            project: 'test',
            repository: 'test',
            branch: 'test',
            filePath: 'test',
          },
        }),
      ),
    ).rejects.toThrow("myParameter cannot be 'foo'");
  });
});
