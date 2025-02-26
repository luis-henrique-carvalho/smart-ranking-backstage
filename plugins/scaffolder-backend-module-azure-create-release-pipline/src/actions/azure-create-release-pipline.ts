import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import api from '../config/api';

/**
 * Creates an `acme:example` Scaffolder action.
 *
 * @remarks
 *
 * See {@link https://example.com} for more information.
 *
 * @public
 */
export function createExampleAction() {
  // For more information on how to define custom actions, see
  //   https://backstage.io/docs/features/software-templates/writing-custom-actions
  return createTemplateAction<{
    name: string;
    project: { name: string; id: string };
    organization: string;
    decription: string;
    withReference: boolean;
    repository?: { name: string; id: string };
    reference?: string;
  }>({
    id: 'azure:create-release-pipline',
    description: 'Creates a new Azure release pipline',
    schema: {
      input: {
        type: 'object',
        required: [
          'name',
          'project',
          'organization',
          'decription',
          'withReference',
        ],
        properties: {
          name: {
            type: 'string',
            title: 'Name',
            description: 'The name of the release pipline',
          },
          project: {
            type: 'object',
            title: 'Project',
            description: 'The project the release pipline belongs to',
            properties: {
              name: {
                type: 'string',
                title: 'Name',
                description: 'The name of the project',
              },
              id: {
                type: 'string',
                title: 'ID',
                description: 'The ID of the project',
              },
            },
          },
          organization: {
            type: 'string',
            title: 'Organization',
            description: 'The organization the release pipline belongs to',
          },
          decription: {
            type: 'string',
            title: 'Decription',
            description: 'The decription of the release pipline',
          },
          withReference: {
            type: 'boolean',
            title: 'With References',
            description: 'Whether to include references in the release pipline',
          },
          repository: {
            type: 'object',
            title: 'Repository',
            description: 'The repository the release pipline belongs to',
            properties: {
              name: {
                type: 'string',
                title: 'Name',
                description: 'The name of the repository',
              },
              id: {
                type: 'string',
                title: 'ID',
                description: 'The ID of the repository',
              },
            },
          },
          reference: {
            type: 'string',
            title: 'Reference',
            description: 'The reference the release pipline belongs to',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          releaseId: {
            type: 'string',
            title: 'Release ID',
            description: 'The ID of the created release',
          },
          releaseUrl: {
            type: 'string',
            title: 'Release URL',
            description: 'The URL of the created release',
          },
        },
      },
    },
    async handler(ctx) {
      const {
        name,
        project,
        organization,
        decription,
        withReference,
        repository,
        reference,
      } = ctx.input;

      const referenceEnvironments: any = [];
      const referenceArtifacts: any = [];

      const defautEnvironments = [
        {
          name: 'Desenvolvimento',
          rank: 1,
          deployPhases: [
            {
              name: 'Deploy Principal',
              phaseType: 'agentBasedDeployment',
              deploymentInput: {
                parallelExecution: {
                  parallelExecutionType: 'none',
                },
                agentSpecification: null,
                skipArtifactsDownload: false,
                artifactsDownloadInput: {
                  downloadInputs: [],
                },
                queueId: 4,
                demands: [],
                enableAccessToken: false,
                timeoutInMinutes: 0,
                jobCancelTimeoutInMinutes: 1,
                condition: 'succeeded()',
                overrideInputs: {},
              },
              workflowTasks: [
                {
                  environment: {},
                  taskId: '72ba822e-4ed5-42aa-bed0-912aec426ab0',
                  version: '1.*',
                  name: 'Task group: Preaparar Variáveis ',
                  refName: '',
                  enabled: true,
                  alwaysRun: true,
                  continueOnError: true,
                  timeoutInMinutes: 0,
                  retryCountOnTaskFailure: 0,
                  definitionType: 'metaTask',
                  overrideInputs: {},
                  condition: 'succeededOrFailed()',
                  inputs: {},
                },
              ],
              rank: 1,
            },
          ],
          retentionPolicy: {
            daysToKeep: 30,
            releasesToKeep: 3,
            retainBuild: true,
          },
          preDeployApprovals: {
            approvals: [
              {
                rank: 1,
                isAutomated: true,
                isNotificationOn: false,
              },
            ],
          },
          postDeployApprovals: {
            approvals: [
              {
                rank: 1,
                isAutomated: true,
                isNotificationOn: false,
              },
            ],
          },
        },
      ];

      const defaultArtifacts = [
        {
          alias: `_${repository?.name ?? ''}`,
          type: 'Git',
          definitionReference: {
            branches: {
              id: '',
              name: 'master',
            },
            definition: {
              id: repository?.id ?? '',
              name: repository?.name ?? '',
            },
            project: {
              id: project.id,
              name: project.name,
            },
          },
        },
      ];

      const realeaseDefinitionUrl = `/${organization}/${project.name}/_apis/release/definitions?api-version=7.1`;

      if (withReference) {
        ctx.logger.info(`Fetching release definition references`);
        const getRealeaseDefinitionUrl = `/${organization}/${project.name}/_apis/release/definitions/${reference}?api-version=7.1`;

        const releaseGetResponse = await api.get(getRealeaseDefinitionUrl);

        if (releaseGetResponse.status !== 200) {
          throw new Error(
            `Failed to fetch release pipline: ${releaseGetResponse}`,
          );
        }

        const releaseData = releaseGetResponse.data;

        ctx.logger.info(`Release data: ${JSON.stringify(releaseData)}`);

        referenceEnvironments.push(...releaseData.environments);

        referenceArtifacts.push(
          ...releaseData.artifacts.map((artifact: any) => {
            return {
              alias: artifact.alias,
              type: artifact.type,
              definitionReference: {
                branches: {
                  id: artifact.definitionReference.branches.id,
                  name: artifact.definitionReference.branches.name,
                },
                definition: {
                  id: artifact.definitionReference.definition.id,
                  name: artifact.definitionReference.definition.name,
                },
                project: {
                  id: artifact.definitionReference.project.id,
                  name: artifact.definitionReference.project.name,
                },
              },
            };
          }),
        );
      }

      const artifacts = withReference ? referenceArtifacts : defaultArtifacts;
      const environments = withReference
        ? referenceEnvironments
        : defautEnvironments;

      const createRealeaseDefinitionBody = {
        name: name,
        environments: environments,
        artifacts: artifacts,
      };

      ctx.logger.info(`Creating release definition`);
      ctx.logger.info(JSON.stringify(createRealeaseDefinitionBody));

      const response = await api.post(
        realeaseDefinitionUrl,
        createRealeaseDefinitionBody,
      );

      ctx.logger.info(`Release definition created`);

      if (response.status !== 200) {
        ctx.logger.error(`Failed to create release definition: ${response}`);
        throw new Error(`Failed to create release definition: ${response}`);
      }

      ctx.logger.info(`Release definition id: ${response.data.id}`);

      const defaultReleaseBody = {
        definitionId: response.data.id,
        description: decription,
        artifacts: [
          {
            alias: `_${repository?.name ?? ''}`,
            instanceReference: {
              id: 'master',
              name: 'master',
            },
          },
        ],
        isDraft: false,
      };

      const referenceReleaseBody = {
        definitionId: response.data.id,
        description: decription,
        artifacts: [
          ...referenceArtifacts.map((artifact: any) => {
            return {
              alias: artifact.alias,
              instanceReference: {
                id: artifact.definitionReference.branches.id,
                name: artifact.definitionReference.branches.name,
              },
            };
          }),
        ],
        isDraft: false,
      };

      const createReleaseBody = withReference
        ? referenceReleaseBody
        : defaultReleaseBody;

      const releaseUrl = `/${organization}/${project.name}/_apis/release/releases?api-version=7.1`;

      ctx.logger.info(`Creating release`);
      ctx.logger.info(JSON.stringify(createReleaseBody));
      const releaseResponse = await api.post(releaseUrl, createReleaseBody);

      if (releaseResponse.status !== 200) {
        ctx.logger.error(`Failed to create release: ${releaseResponse}`);
        throw new Error(`Failed to create release: ${releaseResponse}`);
      }

      ctx.logger.info(`Release created`);

      ctx.output('releaseId', releaseResponse.data.id);
      ctx.output('releaseUrl', releaseResponse.data._links.web.href);
    },
  });
}
