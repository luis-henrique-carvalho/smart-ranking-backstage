import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import api from '../config/api';

export function createAzureBranchAction() {
  return createTemplateAction<{
    repository: string;
    organization: string;
    project: string;
    branchNames: string[];
  }>({
    id: 'azure:create-branch',
    description: 'Creates standard branches in Azure DevOps repository',
    schema: {
      input: {
        required: ['repository', 'organization', 'project', 'branchNames'],
        type: 'object',
        properties: {
          repository: {
            type: 'string',
            title: 'Repository URL',
            description: 'The URL of the repository',
          },
          organization: {
            type: 'string',
            title: 'Organization',
          },
          project: {
            type: 'string',
            title: 'Project',
          },
          branchNames: {
            type: 'array',
            title: 'Target Branches',
            description: 'List of branches to be created',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
    async handler(ctx) {
      const { repository, organization, project, branchNames } = ctx.input;

      try {
        const azureUrl = `/${organization}/${project}/_apis/git/repositories/${repository}/refs?api-version=7.1-preview.1`;
        const repositoryResponse = await api.get(azureUrl);
        const repositoryId = repositoryResponse.data.value[0].objectId;

        if (repositoryResponse.status !== 200) {
          throw new Error(
            `Failed to fetch repository reference: ${repositoryResponse}`,
          );
        }

        const createBranchsBody = branchNames.map(branchName => {
          return {
            name: `refs/heads/${branchName}`,
            oldObjectId: '0000000000000000000000000000000000000000',
            newObjectId: repositoryId,
          };
        });

        await api.post(azureUrl, createBranchsBody);

        ctx.logger.info('All branches created successfully!');
      } catch (error) {
        ctx.logger.error(error);
        throw new Error('Failed to create branches');
      }
    },
  });
}
