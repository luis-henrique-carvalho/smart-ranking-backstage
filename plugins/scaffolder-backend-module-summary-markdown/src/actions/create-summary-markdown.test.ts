import { createSummaryMarkdownAction } from './create-summary-markdown';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

describe('createSummaryMarkdownAction', () => {
  it('should render a table section', async () => {
    const action = createSummaryMarkdownAction();
    const mockContext = createMockActionContext({
      input: {
        sections: {
          builds: {
            title: 'Builds',
            mode: 'table',
            data: [
              { name: 'Alice', age: 30 },
              { name: 'Bob', age: 25 },
            ],
          },
        },
      },
    });

    const outputMock = jest.fn();
    mockContext.output = outputMock;

    await action.handler(mockContext);

    const [[, markdown]] = outputMock.mock.calls;

    expect(markdown).toContain('| name | age |');
    expect(markdown).toContain('| Alice | 30 |');
    expect(markdown).toContain('| Bob | 25 |');
  });

  it('should render a list section', async () => {
    const action = createSummaryMarkdownAction();
    const mockContext = createMockActionContext({
      input: {
        sections: {
          nomes: {
            title: 'Nomes',
            mode: 'list',
            data: ['Alice', 'Bob', 'Carol'],
          },
        },
      },
    });

    const outputMock = jest.fn();
    mockContext.output = outputMock;

    await action.handler(mockContext);

    const [[, markdown]] = outputMock.mock.calls;

    expect(markdown).toContain('- Alice');
    expect(markdown).toContain('- Bob');
    expect(markdown).toContain('- Carol');
  });

  it('should render a properties section', async () => {
    const action = createSummaryMarkdownAction();
    const mockContext = createMockActionContext({
      input: {
        sections: {
          config: {
            title: 'Configuração',
            mode: 'properties',
            data: {
              ambiente: 'prod',
              url: 'https://meusistema.com',
              replicas: 3,
            },
          },
        },
      },
    });

    const outputMock = jest.fn();
    mockContext.output = outputMock;

    await action.handler(mockContext);

    const [[, markdown]] = outputMock.mock.calls;

    expect(markdown).toContain('- **ambiente:** prod');
    expect(markdown).toContain(
      '- **url:** [https://meusistema.com](https://meusistema.com)',
    );
    expect(markdown).toContain('- **replicas:** 3');
  });

  it('should render a text section', async () => {
    const action = createSummaryMarkdownAction();
    const mockContext = createMockActionContext({
      input: {
        sections: {
          mensagem: {
            title: 'Mensagem',
            mode: 'text',
            data: 'Deploy realizado com sucesso!',
          },
        },
      },
    });

    const outputMock = jest.fn();
    mockContext.output = outputMock;

    await action.handler(mockContext);

    const [[, markdown]] = outputMock.mock.calls;

    expect(markdown).toContain('Deploy realizado com sucesso!');
  });

  it('should render a heterogeneous array as a list, not a table', async () => {
    const action = createSummaryMarkdownAction();
    const mockContext = createMockActionContext({
      input: {
        sections: {
          hetero: {
            title: 'Heterogêneo',
            data: [
              { name: 'Alice', age: 30 },
              'Bob',
              42,
              { name: 'Carol', age: 28 },
            ],
          },
        },
      },
    });

    const outputMock = jest.fn();
    mockContext.output = outputMock;

    await action.handler(mockContext);

    const [[, markdown]] = outputMock.mock.calls;

    expect(markdown).not.toContain('| name | age |');
    expect(markdown).toContain('- {\n  "name": "Alice",\n  "age": 30\n}');
    expect(markdown).toContain('- Bob');
    expect(markdown).toContain('- 42');
    expect(markdown).toContain('- {\n  "name": "Alice",\n  "age": 30\n}');
  });

  it('should render URLs as markdown links in list', async () => {
    const action = createSummaryMarkdownAction();
    const mockContext = createMockActionContext({
      input: {
        sections: {
          links: {
            title: 'Links',
            mode: 'list',
            data: ['https://backstage.io', 'https://github.com'],
          },
        },
      },
    });

    const outputMock = jest.fn();
    mockContext.output = outputMock;

    await action.handler(mockContext);

    const [[, markdown]] = outputMock.mock.calls;

    expect(markdown).toContain('[https://backstage.io](https://backstage.io)');
    expect(markdown).toContain('[https://github.com](https://github.com)');
  });
});
