import {
  createTemplateAction,
  TemplateAction,
} from '@backstage/plugin-scaffolder-node';

/**
 * Cria uma action que gera um resumo em Markdown dos outputs de outras actions.
 *
 * @remarks
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

type SummaryInput = {
  sections: Record<string, SectionConfig | any>;
};

export function createSummaryMarkdownAction(): TemplateAction<SummaryInput> {
  return createTemplateAction<SummaryInput>({
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

      // Validação básica do input
      if (!sections || typeof sections !== 'object') {
        throw new Error('O input "sections" deve ser um objeto válido.');
      }

      const markdownParts: string[] = ['# Resumo das Actions\n\n'];

      for (const [sectionName, sectionValue] of Object.entries(sections)) {
        const {
          title,
          mode: initialMode,
          data,
        } = parseSectionValue(sectionValue, sectionName);

        let mode = initialMode;

        markdownParts.push(`## ${title}\n`);

        // Detecta o modo de exibição se for 'auto'
        if (mode === 'auto') {
          mode = detectMode(data);
        }

        // Renderiza conforme o modo
        markdownParts.push(renderSection(data, mode));
        markdownParts.push('\n');
      }

      ctx.output('markdown', markdownParts.join(''));
    },
  });
}

/**
 * Função auxiliar para processar o valor de uma seção.
 */
function parseSectionValue(
  sectionValue: any,
  sectionName: string,
): { title: string; mode: SectionConfig['mode']; data: any } {
  if (
    typeof sectionValue === 'object' &&
    sectionValue !== null &&
    'data' in sectionValue
  ) {
    return {
      title: sectionValue.title || sectionName,
      mode: sectionValue.mode || 'auto',
      data: sectionValue.data,
    };
  }
  return { title: sectionName, mode: 'auto', data: sectionValue };
}

/**
 * Detecta o modo de exibição ideal para os dados.
 */
function detectMode(data: any): SectionConfig['mode'] {
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      return 'table';
    }
    return 'list';
  }
  if (typeof data === 'object' && data !== null) {
    return 'properties';
  }
  return 'text';
}

/**
 * Renderiza uma seção em Markdown conforme o modo.
 */
function renderSection(data: any, mode: SectionConfig['mode']): string {
  if (!data) return '';

  switch (mode) {
    case 'table':
      return renderTable(data);
    case 'list':
      return renderList(data);
    case 'properties':
      return renderProperties(data);
    case 'text':
    default:
      return renderText(data);
  }
}

function renderTable(data: any[]): string {
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    typeof data[0] !== 'object'
  ) {
    return '';
  }
  const headers = Object.keys(data[0]);
  let table = `| ${headers.join(' | ')} |\n`;
  table += `| ${headers.map(() => '---').join(' | ')} |\n`;
  for (const item of data) {
    table += `| ${headers.map(h => item[h] ?? '').join(' | ')} |\n`;
  }
  return table;
}

function renderList(data: any[]): string {
  if (!Array.isArray(data)) return '';
  return data
    .map(item => `- ${typeof item === 'object' ? JSON.stringify(item) : item}`)
    .join('\n');
}

function renderProperties(data: object): string {
  if (typeof data !== 'object' || data === null) return '';
  return Object.entries(data)
    .map(
      ([key, value]) =>
        `- **${key}:** ${
          typeof value === 'object' ? JSON.stringify(value) : value
        }`,
    )
    .join('\n');
}

function renderText(data: any): string {
  return typeof data === 'object'
    ? JSON.stringify(data, null, 2)
    : String(data);
}
