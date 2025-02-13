import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import api from '../config/api';

export function createExampleAction() {
  return createTemplateAction<{
    organization: string;
    project: string;
    repository: string;
    fileList: Array<{
      filePath: string;
      fileType: string;
      content: string;
    }>;
    branch: string;
  }>({
    id: 'azure:commit-changes',
    description: 'Commits multiple files to Azure DevOps.',
    schema: {
      input: {
        type: 'object',
        required: [
          'organization',
          'project',
          'repository',
          'fileList',
          'branch',
        ],
        properties: {
          organization: {
            type: 'string',
            description: 'Name of the organization in Azure DevOps',
          },
          project: {
            type: 'string',
            description: 'Name of the project in Azure DevOps',
          },
          repository: {
            type: 'string',
            description: 'Name of the repository in Azure DevOps',
          },
          fileList: {
            type: 'array',
            description: 'List of files to commit',
            items: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'File path in the repository',
                },
                fileType: {
                  type: 'string',
                  description: 'File type/extension (e.g., "txt", "json")',
                },
                content: {
                  type: 'string',
                  description: 'Content of the file',
                },
              },
            },
          },
          branch: {
            type: 'string',
            description: 'Branch where the commit will be made',
          },
        },
      },
    },
    async handler(ctx) {
      const { organization, project, repository, fileList, branch } = ctx.input;

      try {
        const azureRepositoryUrl = `/${organization}/${project}/_apis/git/repositories/${repository}/refs?api-version=7.1-preview.1`;
        ctx.logger.info(
          `Fetching repository reference from: ${azureRepositoryUrl}`,
        );

        const repositoryResponse = await api.get(azureRepositoryUrl);
        if (repositoryResponse.status !== 200) {
          throw new Error(
            `Failed to fetch repository reference: ${repositoryResponse.status} - ${repositoryResponse.statusText}`,
          );
        }

        const oldObjectId = repositoryResponse.data.value[0].objectId;
        ctx.logger.info(
          `Latest reference for branch ${branch}: ${oldObjectId}`,
        );

        const changes = fileList.map(file => ({
          changeType: 'add',
          item: { path: `${file.filePath}.${file.fileType}` },
          newContent: {
            content: file.content,
            contentType: 'rawtext',
          },
        }));

        const commitPayload = {
          refUpdates: [
            {
              name: `refs/heads/${branch}`,
              oldObjectId: oldObjectId,
            },
          ],
          commits: [
            {
              comment: 'Adding multiple files via Backstage.io',
              changes: changes,
            },
          ],
        };

        const azureCommitUrl = `/${organization}/${project}/_apis/git/repositories/${repository}/pushes?api-version=6.0`;
        ctx.logger.info(`Sending commit to: ${azureCommitUrl}`);

        const commitResponse = await api.post(
          azureCommitUrl,
          JSON.stringify(commitPayload),
        );

        if (commitResponse.status !== 201) {
          throw new Error(
            `Failed to commit changes: ${commitResponse.status} - ${commitResponse.statusText}`,
          );
        }

        ctx.logger.info(
          `Successfully committed ${fileList.length} files to Azure DevOps!`,
        );
      } catch (error) {
        ctx.logger.error(`Error during Azure DevOps commit: ${error}`);
        throw new Error(`Failed to commit changes: ${error}`);
      }
    },
  });
}
