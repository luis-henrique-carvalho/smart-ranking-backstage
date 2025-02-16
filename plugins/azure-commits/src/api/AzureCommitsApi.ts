import {
  ConfigApi,
  createApiRef,
  DiscoveryApi,
} from '@backstage/core-plugin-api';
import { CommitResponse } from '../types';

export const AzureCommitsApiRef = createApiRef<AzureCommitsApi>({
  id: 'plugin.azure-commits.service',
});

export interface AzureCommitsApi {
  getCommits(repositoryUrl: string): Promise<CommitResponse>;
}

export class AzureCommitsApiClient implements AzureCommitsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly configApi: ConfigApi;

  constructor(options: { discoveryApi: DiscoveryApi; configApi: ConfigApi }) {
    this.discoveryApi = options.discoveryApi;
    this.configApi = options.configApi;
  }

  async getCommits(repositoryUrl: string): Promise<CommitResponse> {
    const token =
      '9WgXVwevRNpsjlcvST72zdCiLKKUaVMgJ9Bk9jhmpO2hGz9YNTbvJQQJ99BBACAAAAAAAAAAAAASAZDOdXGG';
    const resp = await fetch(repositoryUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) throw new Error(resp.statusText);

    return await resp.json();
  }
}
