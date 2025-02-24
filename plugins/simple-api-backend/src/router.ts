import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { AplicationService } from './services/AplicationService/types';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';

export async function createRouter({
  aplicationService,
}: {
  aplicationService: AplicationService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.use('/docs', swaggerUi.serve, (req, res) => {
    const swaggerDocument = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'),
    );
    res.send(swaggerUi.generateHTML(swaggerDocument));
  });

  const aplicationSchema = z.object({
    name: z.string(),
    technology: z.string(),
  });

  router.post('/aplications', async (req, res) => {
    const parsed = aplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await aplicationService.createAplications(parsed.data);

    res.status(201).json(result);
  });

  router.get('/aplications', async (_req, res) => {
    res.json(await aplicationService.listAplications());
  });

  return router;
}
