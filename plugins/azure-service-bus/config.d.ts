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
      piplineUrl: string;
      /**
       * @visibility frontend
       */
      piplineToken: string;
    };
  };
}
