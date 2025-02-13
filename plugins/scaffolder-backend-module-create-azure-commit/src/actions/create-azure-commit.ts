import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import api from '../config/api';
import fs from 'fs';
import path from 'path';

export function createExampleAction() {
  return createTemplateAction<{
    organization: string;
    project: string;
    repository: string;
    filePath: string;
    branch: string;
  }>({
    id: 'azure:commit-changes',
    description: 'Commits the file to Azure DevOps.',
    schema: {
      input: {
        type: 'object',
        required: [
          'organization',
          'project',
          'repository',
          'filePath',
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
          filePath: {
            type: 'string',
            description: 'Path of the file in the repository',
          },
          branch: {
            type: 'string',
            description: 'Branch where the commit will be made',
          },
        },
      },
    },
    async handler(ctx) {
      const { organization, project, repository, filePath, branch } = ctx.input;

      try {
        const correctedFilePath = filePath.replace(/^\.\//, '');

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

        const azureCommitUrl = `/${organization}/${project}/_apis/git/repositories/${repository}/pushes?api-version=6.0`;
        const tempFilePath = path.join('temp', correctedFilePath);

        if (!fs.existsSync(tempFilePath)) {
          throw new Error(`File not found: ${tempFilePath}`);
        }

        const fileContent = fs.readFileSync(tempFilePath, 'utf8');
        const base64Content = Buffer.from(fileContent).toString('base64');

        const commitPayload = {
          refUpdates: [
            {
              name: `refs/heads/${branch}`,
              oldObjectId: oldObjectId,
            },
          ],
          commits: [
            {
              comment: 'Adding file via Backstage.io',
              changes: [
                {
                  changeType: 'add',
                  item: { path: correctedFilePath },
                  newContent: {
                    content: base64Content,
                    contentType: 'base64encoded',
                  },
                },
              ],
            },
          ],
        };

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
          `File ${correctedFilePath} successfully committed to Azure DevOps!`,
        );
      } catch (error) {
        if (error instanceof Error) {
          ctx.logger.error(
            `Error during Azure DevOps commit: ${error.message}`,
          );
          throw new Error(`Failed to commit changes: ${error.message}`);
        } else {
          ctx.logger.error('Unknown error during Azure DevOps commit');
          throw new Error('Failed to commit changes due to unknown error');
        }
      }
    },
  });
}
