// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  // set the app mode
  production: false,
  // set the app domain (required to set the cookie)
  appDomain: 'lifemonitor.eu',
  // 'logLevel': the log level of the application
  logLevel: 'INFO',
  // 'apiBaseUrl': base URL of the LifeMonitor API instance
  //               (e.g., https://api.lifemonitor.eu)
  apiBaseUrl: '<LIFEMONITOR_API_BASE_URL>',
  // 'socketBaseUrl': base URL of the LifeMonitor Socket endpoint
  //               (e.g., https://api.lifemonitor.eu)
  socketBaseUrl: '<LIFEMONITOR_SOCKET_BASE_URL>',
  // 'clientId': OAuth2 ClientID that can be obtained by registering
  //             an OAuth2 app with <LIFEMONITOR_API_BASE_URL>/profile -> OAuth Apps
  clientId: '<LIFEMONITOR_OAUTH2_CLIENT_ID>',
  // 'configFile': the path of a JSON resource containing
  //               the configuration properties that should be loaded
  //               and set without rebuild (e.g., apiBaseUrl, clientId).
  //               They overwrite the default environment settings defined at build-time
  //               and are exposed by the `AppConfigService.getConfig()` method.
  configFile: '/assets/config.json',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
