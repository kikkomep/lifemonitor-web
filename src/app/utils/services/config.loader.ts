/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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

  constructor() { }

  public onLoad: Observable<boolean> = this.subject.asObservable();

  public loadConfig(): Observable<any> {
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

  public get maintenanceMode(): boolean {
    try {
      return this.config['maintenanceMode'];
    } catch (e) {
      this.logger.error('Unable to load configuration from server', e);
      return false;
    }
  }

  public get maintenanceMessage(): string {
    return this.config['maintenanceMessage'];
  }

  public get apiBaseUrl(): string {
    return this.config['apiBaseUrl'];
  }

  public get socketBaseUrl(): string {
    return this.config['socketBaseUrl'];
  }
}
