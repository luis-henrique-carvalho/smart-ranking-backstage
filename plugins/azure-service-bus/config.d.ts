export interface Config {
  plugins: {
    /**
     * Frontend root URL
     * @visibility frontend
     */
    azureServiceBus: {
      /**
       * @visibility frontend
       */
      pipelineUrl: string;
      /**
       * @visibility frontend
       */
      pipelineToken: string;
    };
  };
}
