import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { AplicationService } from './services/AplicationService/types';

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

  const aplicationSchema = z.object({
    name: z.string(),
    tecnology: z.string(),
  });

  router.post('/aplications', async (req, res) => {
    const parsed = aplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await aplicationService.createAplications(parsed.data);

    res.status(201).json(result);
  });

  router.get('/todos', async (_req, res) => {
    res.json(await aplicationService.listAplications());
  });

  return router;
}
