import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Logger, LoggerManager } from '../logging';

export class AppConfigLoader {
  private config: any = { ...environment };

  private subject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  // initialize logger
  private logger: Logger = LoggerManager.create('AppConfigService');

  constructor() {}

  public onLoad: Observable<boolean> = this.subject.asObservable();

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
              this.logger.info(
                'Configuration updated from ' + environment['configFile'],
                this.config
              );
              if (environment.production) {
                LoggerManager.setProductionMode();
              } else {
                LoggerManager.setDevelopmentMode();
              }

              this.subject.next(true);
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

  public get clientId(): string {
    return this.config['clientId'];
  }

  public get productionMode(): boolean {
    return this.config['production'];
  }

  public get developmentMode(): boolean {
    return !this.config['production'];
  }

  public get apiBaseUrl(): string {
    return this.config['apiBaseUrl'];
  }

  public get socketBaseUrl(): string {
    return this.config['socketBaseUrl'];
  }
}
