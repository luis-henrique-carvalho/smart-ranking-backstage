export interface Config {
  app: {
    /**
     * Frontend root URL
     * @visibility frontend
     */
    baseUrl: string;
    env: {
      /**
       * API base URL
       * @visibility frontend
       */
      api_base_url: string;
    };
  };
}
