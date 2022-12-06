import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Config } from '../../models/config.model';
import { Logger, LoggerManager } from '../../utils/logging';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: any = { ...environment };

  // initialize logger
  private logger: Logger = LoggerManager.getLogger('ConfigService');

  constructor(private http: HttpClient) {}

  public loadConfig(): Observable<Config> {
    let config = this.getConfig();
    if (!('configFile' in config)) {
      return of(config);
    }
    return this.http.get(config['configFile']).pipe(
      map((data: any): Config => {
        this.config = Object.assign({}, environment, data);
        this.logger.debug(
          'Configuration updated from ' + environment['configFile'],
          this.config
        );
        let result = { ...data } as Config;
        result['configFile'] = config['configFile'];
        return result;
      }),
      tap((data: Config) => {
        this.logger.debug('Loaded configuration: ', data);
      }),
      catchError((error) => {
        this.logger.error('Unable to load configuration from server', error);
        throw new Error('Unable to load the configuration file');
      })
    );
  }

  public getConfig() {
    return this.config;
  }
}
