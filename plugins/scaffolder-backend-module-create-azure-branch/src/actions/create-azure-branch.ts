import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

type SectionConfig = {
  title?: string;
  mode?: 'table' | 'list' | 'properties' | 'text' | 'auto';
  data: any;
};

export const summaryMarkdown = createTemplateAction<{
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
        data.forEach(item => {
          markdown += `| ${headers.map(h => item[h] ?? '').join(' | ')} |\n`;
        });
      } else if (mode === 'list' && Array.isArray(data)) {
        data.forEach(item => {
          markdown += `- ${
            typeof item === 'object' ? JSON.stringify(item) : item
          }\n`;
        });
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
