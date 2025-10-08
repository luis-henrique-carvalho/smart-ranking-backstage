import {
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  augmentationIndexerExtensionPoint,
  retrievalPipelineExtensionPoint,
  modelExtensionPoint,
} from '@alithya-oss/backstage-plugin-rag-ai-node';
import { createRoadiePgVectorStore } from '@alithya-oss/backstage-plugin-rag-ai-storage-pgvector';
import { createDefaultRetrievalPipeline } from '@alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter';
import { CatalogClient } from '@backstage/catalog-client';
import { initializeOpenAiEmbeddings } from '@alithya-oss/backstage-plugin-rag-ai-backend-embeddings-openai';
import { ChatOpenAI } from '@langchain/openai';

// import { OpenAI  } from '@langchain/openai';

// import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const ragai = createBackendModule({
  pluginId: 'rag-ai',
  moduleId: 'config',
  register(env) {
    env.registerInit({
      deps: {
        auth: coreServices.auth,
        logger: coreServices.logger,
        database: coreServices.database,
        discovery: coreServices.discovery,
        config: coreServices.rootConfig,
        indexer: augmentationIndexerExtensionPoint,
        pipeline: retrievalPipelineExtensionPoint,
        model: modelExtensionPoint,
        scheduler: coreServices.scheduler,
      },
      async init({
        auth,
        logger,
        database,
        discovery,
        config,
        indexer,
        pipeline,
        model,
        scheduler,
      }) {
        const catalogApi = new CatalogClient({ discoveryApi: discovery });
        const vectorStore = await createRoadiePgVectorStore({
          logger: loggerToWinstonLogger(logger),
          database,
          config,
        });

        indexer.setAugmentationIndexer(
          await initializeOpenAiEmbeddings({
            auth,
            logger: loggerToWinstonLogger(logger),
            discovery,
            // @ts-ignore
            catalogApi,
            vectorStore,
            config,
          }),
        );

        pipeline.setRetrievalPipeline(
          createDefaultRetrievalPipeline({
            auth,
            logger: loggerToWinstonLogger(logger),
            discovery,
            vectorStore,
          }),
        );

        model.setBaseLLM(
          new ChatOpenAI({
            model: 'gpt-4',
            temperature: 0.9,
            maxTokens: 1000,
            maxRetries: 5,
            apiKey: config.getString('ai.embeddings.openai.openAIApiKey'),
          }) as any,
        );
        const scheduleLogger = logger.child({
          name: 'EmbeddingsCreationScheduler',
        });
        const baseUrl = await discovery.getBaseUrl('rag-ai');
        logger.info(`RAG AI base URL: ${baseUrl}`);

        scheduler.scheduleTask({
          id: 'create-catalog-embeddings',
          // ATENÇÃO: 10 segundos é ótimo para teste, mas mude de volta
          // para { days: 1 } em produção.
          frequency: { days: 1 },
          initialDelay: { seconds: 30 },
          timeout: { seconds: 180 },
          fn: async () => {
            // 1. Gere um token de autenticação de serviço-para-serviço
            const { token } = await auth.getPluginRequestToken({
              onBehalfOf: await auth.getOwnServiceCredentials(),
              targetPluginId: 'rag-ai',
            });

            const url = `${baseUrl}/embeddings/catalog`;
            const options = {
              method: 'POST',
              body: '{"entityFilter":{}}',
              // 2. Adicione o token no cabeçalho da requisição
              headers: {
                Authorization: `Bearer ${token}`,
              },
            };

            try {
              scheduleLogger.info('Triggering catalog embedding creation...');
              const response = await fetch(url, options);

              // Adiciona uma verificação para a resposta da requisição
              if (!response.ok) {
                const errorText = await response.text();
                scheduleLogger.error(
                  `Failed to create embeddings. Status: ${response.status}. Body: ${errorText}`,
                );
                return;
              }

              const data = await response.json();
              scheduleLogger.info(data);
            } catch (error) {
              scheduleLogger.error(error as any);
            }
          },
        });
      },
    });
  },
});
