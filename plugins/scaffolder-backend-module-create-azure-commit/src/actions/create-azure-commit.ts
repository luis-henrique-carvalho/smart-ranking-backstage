import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
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
    description: 'Faz commit do arquivo para o Azure DevOps.',
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
            description: 'Nome da organização no Azure DevOps',
          },
          project: {
            type: 'string',
            description: 'Nome do projeto no Azure DevOps',
          },
          repository: {
            type: 'string',
            description: 'Nome do repositório no Azure DevOps',
          },
          filePath: {
            type: 'string',
            description: 'Caminho do arquivo no repositório',
          },
          branch: {
            type: 'string',
            description: 'Branch onde o commit será feito',
          },
        },
      },
    },
    async handler(ctx) {
      const { organization, project, repository, filePath, branch } = ctx.input;
      const pat = process.env.AZURE_TOKEN;

      const correctedFilePath = filePath.replace(/^\.\//, ''); // Remove "./" do início do caminho

      const refUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/refs?api-version=7.1-preview.1`;
      const refResponse = await fetch(refUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
        },
      });

      if (!refResponse.ok) {
        const errorText = await refResponse.text();
        throw new Error(
          `Erro ao obter referência: ${refResponse.status} - ${errorText}`,
        );
      }

      const refData = await refResponse.json();
      ctx.logger.info(
        `Obtendo referência do branch ${refData.value[0].objectId}...`,
      );
      const oldObjectId = refData.value[0].objectId;

      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repository}/pushes?api-version=6.0`;

      const tempFilePath = path.join('temp', correctedFilePath);
      if (!fs.existsSync(tempFilePath)) {
        throw new Error(`Arquivo não encontrado: ${tempFilePath}`);
      }

      const fileContent = fs.readFileSync(tempFilePath, 'utf8');
      ctx.logger.info(`Lendo arquivo ${tempFilePath}...`);
      ctx.logger.info(`Conteúdo do arquivo: ${fileContent}`);

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
            comment: 'Adicionando arquivo via Backstage.io',
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

      // Enviar o commit para o Azure DevOps
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
        },
        body: JSON.stringify(commitPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro ao fazer commit: ${response.status} - ${errorText}`,
        );
      }

      ctx.logger.info(
        `Arquivo ${correctedFilePath} enviado para o Azure DevOps com sucesso!`,
      );
    },
  });
}
