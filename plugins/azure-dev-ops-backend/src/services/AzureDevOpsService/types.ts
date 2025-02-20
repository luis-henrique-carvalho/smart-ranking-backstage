export interface AzureDevOpsReleasePipeline {
  source: string;
  revision: number;
  description: string | null;
  createdBy: {
    displayName: string;
    url: string;
    _links: {
      avatar: {
        href: string;
      };
    };
    id: string;
    uniqueName: string;
    imageUrl: string;
    descriptor: string;
  };
  createdOn: string;
  modifiedBy: {
    displayName: string;
    url: string;
    _links: {
      avatar: {
        href: string;
      };
    };
    id: string;
    uniqueName: string;
    imageUrl: string;
    descriptor: string;
  };
  modifiedOn: string;
  isDeleted: boolean;
  isDisabled: boolean;
  variableGroups: null;
  releaseNameFormat: string;
  comment: string;
  properties: Record<string, unknown>;
  id: number;
  name: string;
  path: string;
  projectReference: null;
  url: string;
  _links: {
    self: {
      href: string;
    };
    web: {
      href: string;
    };
  };
}

export interface AzureDevOpsReleasePipelinesResponse {
  count: number;
  value: AzureDevOpsReleasePipeline[];
}

export interface AzureDevOpsService {
  listReleasePipelines(
    organization: string,
    project: string,
  ): Promise<AzureDevOpsReleasePipelinesResponse>;
}
