import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Config, Logger, LoggerManager } from '../logging';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {

  private config: any = { ...environment };

  // initialize logger
  private logger: Logger = LoggerManager.create('AppConfigService');

  constructor(private http: HttpClient) { }

  public loadConfig(): Observable<object> {
    if (!('configFile' in environment)) {
      return of(this.config);
    }
    return this.http
      .get(environment['configFile'])
      .pipe(
        map((data) => {
          this.config = Object.assign({}, environment, data);
          Config.init(this.config);
          this.logger.debug(
            'Configuration updated from ' + environment['configFile'],
            this.config
          );
          return data;
        }),
        tap((data) => { }),
        catchError((error) => {
          this.logger.error('Unable to load configuration from server', error);
          return of({});
        })
      );
  }

  public getConfig() {
    return this.config;
  }
}
