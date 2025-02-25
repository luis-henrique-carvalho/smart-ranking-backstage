import axios from 'axios';

const api = axios.create({
  baseURL: process.env.AZURE_RELEASE_URL,
  headers: {
    Authorization: `Basic ${Buffer.from(`:${process.env.AZURE_TOKEN}`).toString(
      'base64',
    )}`,
    'Content-Type': 'application/json',
  },
});
export default api;
