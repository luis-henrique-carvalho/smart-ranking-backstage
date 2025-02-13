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
  // For more information on how to define custom actions, see
  //   https://backstage.io/docs/features/software-templates/writing-custom-actions
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
      const dirPath = path.dirname(filePath);

      fs.mkdirSync(dirPath, { recursive: true });

      fs.writeFileSync(path.resolve(filePath), content, 'utf8');
      ctx.logger.info(`Arquivo criado: ${filePath}`);
      ctx.logger.info(`Conteúdo: ${content}`);
    },
  });
}
