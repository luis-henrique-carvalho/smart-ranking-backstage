import {
  createTemplateAction,
  TemplateAction,
} from '@backstage/plugin-scaffolder-node';

/**
 * Cria uma action que gera um resumo em Markdown dos outputs de outras actions.
 *
 * @remarks
 *
 * A action aceita um objeto `sections` onde cada chave é o nome da seção e o valor pode ser:
 * - O dado diretamente (array, objeto, string, etc)
 * - Um objeto com configuração: `{ title?: string, mode?: 'table' | 'list' | 'properties' | 'text' | 'auto', data: any }`
 *
 * O modo pode ser:
 * - 'table': array de objetos como tabela Markdown
 * - 'list': array como lista
 * - 'properties': objeto como lista de propriedades
 * - 'text': string ou valor simples
 * - 'auto': detecta automaticamente
 *
 * @public
 */
type SectionConfig = {
  title?: string;
  mode?: 'table' | 'list' | 'properties' | 'text' | 'auto';
  data: any;
};

export function createSummaryMarkdownAction(): TemplateAction<{
  sections: Record<string, SectionConfig | any>;
}> {
  return createTemplateAction<{
    sections: Record<string, SectionConfig | any>;
  }>({
    id: 'custom:summary-markdown',
    schema: {
      input: {
        required: ['sections'],
        type: 'object',
        properties: {
          sections: {
            type: 'object',
            description:
              'Outputs das outras actions, agrupados por nome. Pode ser só o dado ou um objeto com config.',
          },
        },
      },
      output: {
        markdown: {
          type: 'string',
          description: 'Resumo em Markdown',
        },
      },
    },
    async handler(ctx) {
      const { sections } = ctx.input;
      let markdown = '# Resumo das Actions\n\n';

      for (const [sectionName, sectionValue] of Object.entries(sections)) {
        // Permite configuração por seção
        let title = sectionName;
        let mode: SectionConfig['mode'] = 'auto';
        let data = sectionValue;

        if (
          typeof sectionValue === 'object' &&
          sectionValue !== null &&
          'data' in sectionValue
        ) {
          title = sectionValue.title || sectionName;
          mode = sectionValue.mode || 'auto';
          data = sectionValue.data;
        }

        markdown += `## ${title}\n`;

        // Lógica de formatação
        if (mode === 'auto') {
          if (Array.isArray(data)) {
            if (data.length > 0 && typeof data[0] === 'object') {
              mode = 'table';
            } else {
              mode = 'list';
            }
          } else if (typeof data === 'object' && data !== null) {
            mode = 'properties';
          } else {
            mode = 'text';
          }
        }

        if (
          mode === 'table' &&
          Array.isArray(data) &&
          data.length > 0 &&
          typeof data[0] === 'object'
        ) {
          // Tabela Markdown
          const headers = Object.keys(data[0]);
          markdown += `| ${headers.join(' | ')} |\n`;
          markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
          for (const item of data) {
            markdown += `| ${headers.map(h => item[h] ?? '').join(' | ')} |\n`;
          }
        } else if (mode === 'list' && Array.isArray(data)) {
          for (const item of data) {
            markdown += `- ${
              typeof item === 'object' ? JSON.stringify(item) : item
            }\n`;
          }
        } else if (
          mode === 'properties' &&
          typeof data === 'object' &&
          data !== null
        ) {
          for (const [key, value] of Object.entries(data)) {
            markdown += `- **${key}:** ${
              typeof value === 'object' ? JSON.stringify(value) : value
            }\n`;
          }
        } else {
          markdown += `${
            typeof data === 'object' ? JSON.stringify(data, null, 2) : data
          }\n`;
        }

        markdown += '\n';
      }

      ctx.output('markdown', markdown);
    },
  });
}
