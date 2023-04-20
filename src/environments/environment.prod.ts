export const environment = {
  production: true,
  logLevel: "INFO",
  // 'apiBaseUrl': base URL of the LifeMonitor API instance
  //               (e.g., https://api.lifemonitor.eu)
  // apiBaseUrl: '<LIFEMONITOR_API_BASE_URL>',
  // 'clientId': OAuth2 ClientID that can be obtained by registering
  //             an OAuth2 app with <LIFEMONITOR_API_BASE_URL>/profile -> OAuth Apps
  // clientId: '<LIFEMONITOR_OAUTH2_CLIENT_ID>',
  // 'configFile': the path of a JSON resource containing
  //               the configuration properties that should be loaded
  //               and set without rebuild (e.g., apiBaseUrl, clientId).
  //               They overwrite the default environment settings defined at build-time
  //               and are exposed by the `AppConfigService.getConfig()` method.
  configFile: "/assets/config.json",
};
