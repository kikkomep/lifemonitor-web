import { from, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Config, Logger, LoggerManager } from '../logging';

export class AppConfigLoader {
  private config: any = { ...environment };

  // initialize logger
  private logger: Logger = LoggerManager.create('AppConfigService');

  constructor() {}

  public loadConfig(): Observable<object> {
    if (!('configFile' in environment)) {
      return of(this.config);
    }

    return from(
      fetch(environment['configFile'])
        .then((response) =>
          response
            .json()
            .then((data) => {
              this.config = Object.assign({}, environment, data);
              Config.init(this.config);
              this.logger.debug(
                'Configuration updated from ' + environment['configFile'],
                this.config
              );
              return this.config;
            })
            .catch((error) => {
              this.logger.error(
                'Unable to decode configuration data loaded from server',
                error
              );
              return {};
            })
        )
        .catch((error) => {
          this.logger.error('Unable to load configuration from server', error);
          return {};
        })
    );
  }

  public getConfig() {
    return this.config;
  }
}
