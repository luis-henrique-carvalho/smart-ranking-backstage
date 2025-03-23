export type PipelineParams = {
  service_name: string;
  resource_type: 'topic' | 'queue';
  resource_name: string;
  reprocessing_method: 'safe' | 'fast';
  generate_new_message_id: boolean;
};
export interface BuildLog {
  lineCount: number;
  createdOn: string;
  lastChangedOn: string;
  id: number;
  type: string;
  url: string;
}

export interface BuildLogsResponse {
  count: number;
  value: BuildLog[];
}

export interface Build {
  id: number;
  status: string;
}

export interface BuildLogFull {
  id: number;
  value: string[];
}
