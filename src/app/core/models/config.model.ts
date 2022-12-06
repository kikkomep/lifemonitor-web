export interface Config {
  production: boolean;
  // 'apiBaseUrl': base URL of the LifeMonitor API instance
  //               (e.g., https://api.lifemonitor.eu)
  apiBaseUrl: string;
  // 'clientId': OAuth2 ClientID that can be obtained by registering
  //             an OAuth2 app with <LIFEMONITOR_API_BASE_URL>/profile -> OAuth Apps
  clientId: string;
  // 'configFile': the path of a JSON resource containing
  //               the configuration properties that should be loaded
  //               and set without rebuild (e.g., apiBaseUrl, clientId).
  //               They overwrite the default environment settings defined at build-time
  //               and are exposed by the `AppConfigService.getConfig()` method.
  configFile: string;
}
