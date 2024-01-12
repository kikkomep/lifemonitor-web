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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { User } from 'src/app/models/user.modes';
import { Logger, LoggerManager } from '../logging';
import { AuthCookieService } from './auth-cookie.service';
import { AuthOAuth2Service } from './auth-oauth2.service';
import { IAuthService, Token } from './auth.interface';
import { AppConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements IAuthService {
  // Set reference to currently running auth instance
  protected _currentAuthInstance: IAuthService = null;

  // initialize logger
  private logger: Logger = LoggerManager.create('AuthService');

  constructor(
    private config: AppConfigService,
    private httpClient: HttpClient,
    private cookieService: CookieService
  ) {}

  get currentAuthInstance(): IAuthService {
    if (this._currentAuthInstance === null) {
      // Use AuthCookieService if no clientId is set
      if (
        !this.config.clientId ||
        this.config.clientId.startsWith('<LIFEMONITOR_OAUTH2_CLIENT_ID>')
      ) {
        this.logger.debug('Using AuthCookieService');
        this._currentAuthInstance = new AuthCookieService(
          this.config,
          this.httpClient
        );
      } else {
        // Use AuthOauth2Service if clientId is set
        this.logger.debug('Using AuthOauth2Service');
        this._currentAuthInstance = new AuthOAuth2Service(
          this.config,
          this.httpClient
        );
      }
    }
    // If no auth instance is available, throw an error
    if (!this._currentAuthInstance) {
      throw new Error('No auth instance available');
    }
    // Return the current auth instance
    return this._currentAuthInstance;
  }

  public init(): Observable<any> {
    return this.currentAuthInstance.init();
  }

  public authorize() {
    const as = this.currentAuthInstance as AuthCookieService;
    return as.authorize();
  }

  public getToken(): Token {
    return this.currentAuthInstance.getToken();
  }

  public getCurrentUser(): User {
    return this.currentAuthInstance.getCurrentUser();
  }

  public getCurrentUser$(): Observable<User> {
    return this.currentAuthInstance.getCurrentUser$();
  }

  public checkIsUserLogged(): Promise<boolean> {
    return this.currentAuthInstance.checkIsUserLogged();
  }

  public isUserLogged(): boolean {
    return this.currentAuthInstance.isUserLogged();
  }

  public userLogged$(): Observable<boolean> {
    return this.currentAuthInstance.userLogged$();
  }

  public login(): Promise<boolean> {
    return this.currentAuthInstance.login();
  }

  public logout(
    notify: boolean = true,
    closeSession: boolean = true
  ): Promise<boolean> {
    return this.currentAuthInstance.logout(notify, closeSession);
  }

  public isAuthError(error: any): boolean {
    return this.currentAuthInstance.isAuthError(error);
  }
}
