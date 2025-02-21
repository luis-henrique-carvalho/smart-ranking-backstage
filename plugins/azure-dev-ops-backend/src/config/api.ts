import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL: baseURL,
      headers: {
        Authorization: `Basic ${Buffer.from(
          `:${process.env.AZURE_TOKEN}`,
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getClient(): AxiosInstance {
    return this.client;
  }
}

export default ApiClient;
