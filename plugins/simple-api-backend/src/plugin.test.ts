import { startTestBackend } from '@backstage/backend-test-utils';
import { simpleApiPlugin } from './plugin';
import request from 'supertest';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';

// TEMPLATE NOTE:
// Plugin tests are integration tests for your plugin, ensuring that all pieces
// work together end-to-end. You can still mock injected backend services
// however, just like anyone who installs your plugin might replace the
// services with their own implementations.
describe('plugin', () => {
  it('should create and read TODO items', async () => {
    const { server } = await startTestBackend({
      features: [simpleApiPlugin],
    });

    await request(server).get('/api/simple-api/aplications').expect(200, []);

    const createRes = await request(server)
      .post('/api/simple-api/aplications')
      .send({ name: 'My Todo', tecnology: 'Node.js' });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toEqual({
      status: 'created',
      data: {
        name: 'My Todo',
        tecnology: 'Node.js',
      },
    });

    const createdTodoItem = createRes.body.data;

    await request(server)
      .get('/api/simple-api/aplications')
      .expect(200, [createdTodoItem]);
  });

  it('should create TODO item with catalog information', async () => {
    const { server } = await startTestBackend({
      features: [
        simpleApiPlugin,
        catalogServiceMock.factory({
          entities: [
            {
              apiVersion: 'backstage.io/v1alpha1',
              kind: 'Component',
              metadata: {
                name: 'my-component',
                namespace: 'default',
                title: 'My Component',
              },
              spec: {
                type: 'service',
                owner: 'me',
              },
            },
          ],
        }),
      ],
    });

    const createRes = await request(server)
      .post('/api/simple-api/aplications')
      .send({ name: 'My Todo', tecnology: 'Node.js' });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toEqual({
      status: 'created',
      data: {
        name: 'My Todo',
        tecnology: 'Node.js',
      },
    });
  });
});
