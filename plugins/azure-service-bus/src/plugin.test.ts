import { azureServiceBusPlugin } from './plugin';

describe('azure-service-bus', () => {
  it('should export plugin', () => {
    expect(azureServiceBusPlugin).toBeDefined();
  });
});
