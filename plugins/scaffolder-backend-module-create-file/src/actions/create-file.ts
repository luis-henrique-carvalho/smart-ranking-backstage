import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fs from 'fs';
import path from 'path';
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
  return createTemplateAction<{
    filePath: string;
    content: string;
  }>({
    id: 'fs:create-file',
    description: 'Runs an example action',
    schema: {
      input: {
        type: 'object',
        required: ['filePath', 'content'],
        properties: {
          filePath: {
            type: 'string',
            description: 'Caminho do arquivo a ser criado',
          },
          content: { type: 'string', description: 'Conteúdo do arquivo' },
        },
      },
    },
    async handler(ctx) {
      const { filePath, content } = ctx.input;
      const tempFilePath = path.join('temp', filePath);
      const dirPath = path.dirname(tempFilePath);

      fs.mkdirSync(dirPath, { recursive: true });

      fs.writeFileSync(path.resolve(tempFilePath), content, 'utf8');
      ctx.logger.info(`Arquivo criado: ${tempFilePath}`);
    },
  });
}
