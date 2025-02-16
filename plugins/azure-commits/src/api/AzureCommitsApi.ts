import {
  ConfigApi,
  createApiRef,
  DiscoveryApi,
} from '@backstage/core-plugin-api';
import { CommitResponse, BranchsResponse } from '../types';

export const AzureCommitsApiRef = createApiRef<AzureCommitsApi>({
  id: 'plugin.azure-commits.service',
});

export interface AzureCommitsApi {
  getCommits(repositoryUrl: string): Promise<CommitResponse>;
  getBranches(repositoryUrl: string): Promise<BranchsResponse>;
}

export class AzureCommitsApiClient implements AzureCommitsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly configApi: ConfigApi;
  private readonly token: string;

  constructor(options: { discoveryApi: DiscoveryApi; configApi: ConfigApi }) {
    this.discoveryApi = options.discoveryApi;
    this.configApi = options.configApi;
    this.token =
      '9WgXVwevRNpsjlcvST72zdCiLKKUaVMgJ9Bk9jhmpO2hGz9YNTbvJQQJ99BBACAAAAAAAAAAAAASAZDOdXGG';
  }

  async getCommits(repositoryUrl: string): Promise<CommitResponse> {
    const resp = await fetch(repositoryUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) throw new Error(resp.statusText);

    return await resp.json();
  }

  async getBranches(repositoryUrl: string): Promise<BranchsResponse> {
    const resp = await fetch(repositoryUrl, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!resp.ok) throw new Error(resp.statusText);

    return await resp.json();
  }
}
