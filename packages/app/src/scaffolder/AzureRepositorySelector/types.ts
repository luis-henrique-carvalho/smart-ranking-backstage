export interface AzureDevOpsRepositories {
  id: string;
  name: string;
  project: {
    id: string;
    name: string;
    url: string;
    state: string;
    revision: number;
    visibility: string;
    lastUpdateTime: string;
  };
}
