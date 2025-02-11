import { LoggerService } from '@backstage/backend-plugin-api';
import { AplicationService, AplicationItem } from './types';

export async function createAplicationService({
  logger,
}: {
  logger: LoggerService;
}): Promise<AplicationService> {
  logger.info('Initializing AplicationService');

  const storedAplications = new Array<AplicationItem>();

  return {
    async createAplications(application: AplicationItem) {
      const newAplication = {
        name: application.name,
        tecnology: application.tecnology,
      };

      storedAplications.push(newAplication);

      logger.info('Created new todo item', newAplication);

      return { status: 'created', data: newAplication };
    },

    async listAplications() {
      return Array.from(storedAplications);
    },
  };
}
