export type PipelineParams = {
  service_name: string;
  resource_type: 'topic' | 'queue';
  resource_name: string;
  reprocessing_method: 'safe' | 'fast';
  generate_new_message_id: boolean;
};
