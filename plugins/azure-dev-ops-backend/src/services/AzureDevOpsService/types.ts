export interface AzureDevOpsService {
  listReleasePipelines(): Promise<{ items: any }>;
}
