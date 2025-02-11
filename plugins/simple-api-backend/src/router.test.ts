import { mockErrorHandler } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { AplicationService } from './services/AplicationService/types';

const mockCreateAplicationItem = {
  status: 'created',
  data: {
    name: 'Do the thing',
    tecnology: 'Node.js',
  },
};

const mockAplicationItems = [
  {
    name: 'Do the thing',
    tecnology: 'Node.js',
  },
  {
    name: 'Do the other thing',
    tecnology: 'React',
  },
];

describe('createRouter', () => {
  let app: express.Express;
  let aplicationService: jest.Mocked<AplicationService>;

  beforeEach(async () => {
    aplicationService = {
      createAplications: jest.fn(),
      listAplications: jest.fn(),
    };
    const router = await createRouter({
      aplicationService,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should create a aplication', async () => {
    aplicationService.createAplications.mockResolvedValue(
      mockCreateAplicationItem,
    );

    const response = await request(app).post('/aplications').send({
      name: 'Do the thing',
      tecnology: 'Node.js',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockCreateAplicationItem);
  });

  it('should list aplications', async () => {
    aplicationService.listAplications.mockResolvedValue(mockAplicationItems);

    const response = await request(app).get('/aplications');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockAplicationItems);
  });
});
