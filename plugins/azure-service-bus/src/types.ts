// Pipeline-related types
export type PipelineParamsType = {
  service_name: string;
  resource_type: 'topic' | 'queue';
  resource_name: string;
  reprocessing_method: 'safe' | 'fast';
  generate_new_message_id: boolean;
};

// Build log-related types
export interface BuildLogType {
  lineCount: number;
  createdOn: string;
  lastChangedOn: string;
  id: number;
  type: string;
  url: string;
}

export interface BuildLogsResponse {
  count: number;
  value: BuildLogType[];
}

export interface BuildLogDetailsType {
  id: number;
  value: string[];
}

// Build-related types
export interface BuildType {
  id: number;
  status: string;
  buildNumber: string;
  _links: {
    web: {
      href: string;
    };
  };
}

// Queue-related types
export interface BuildItemType {
  resourceType: ResourceType;
  buildId: number;
  status: QueueStatus;
  timestamp: number;
}

type QueueStatus = 'queued' | 'running' | 'completed';
type ResourceType = 'queue' | 'topic';
