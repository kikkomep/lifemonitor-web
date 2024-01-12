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
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from 'src/app/models/user.modes';
import { Logger, LoggerManager } from '../logging';
import { IAuthService, Token } from './auth.interface';
import { AppConfigService } from './config.service';

export abstract class AuthBaseService implements IAuthService {
  // reference to the http client
  protected httpClient: HttpClient = null;
  // reference to the config service
  protected config: AppConfigService = null;

  // key used to store a flag in the local storage
  protected lifemonitorUserKey: string = 'lifemonitor-user';

  // reference to the user data
  protected _userData: any = null;

  // reference to the token: always null for this service
  protected _token = null;

  // initialize logger
  protected logger: Logger = LoggerManager.create(this.constructor.name);

  // initialize the user logged subject
  protected userLoggedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    undefined
  );
  // initialize the user subject
  protected userSubject: BehaviorSubject<User> = new BehaviorSubject<User>(
    undefined
  );

  protected _user: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  protected _userLogged: Subject<boolean> = new Subject<boolean>();

  constructor(config: AppConfigService, httpClient: HttpClient) {
    this.config = config;
    this.httpClient = httpClient;
  }

  public init(): Observable<User | null> {
    return this._fetchUserData(true);
  }

  public getCurrentUser(): User {
    const userData = this.getCurrentUserData();
    if (userData) {
      return new User(userData);
    }
    return null;
  }

  public getCurrentUser$(): Observable<User> {
    return this.userSubject.asObservable();
  }

  public isUserLogged(): boolean {
    return localStorage.getItem(this.lifemonitorUserKey) !== null;
  }

  public userLogged$(): Observable<boolean> {
    return this.userLoggedSubject.asObservable();
  }

  public abstract checkIsUserLogged(): Promise<boolean>;

  protected nonce(length: number) {
    let text = '';
    let possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  protected isCallbackFromAuthServer(): boolean {
    // extract callback param from url query string
    const urlParams = new URLSearchParams(window.location.search);
    const hasCallbackParam = urlParams.has('callback');
    this.logger.debug('Is Returning from AuthServer: ' + hasCallbackParam);
    return hasCallbackParam;
  }

  protected get baseUrl(): string {
    return this.config.apiBaseUrl;
  }

  public abstract login(): Promise<boolean>;

  protected setUserData(user: User | null, notify: boolean = false) {
    this.logger.debug('Setting user data', user, notify);
    this._userData = user;
    if (!user) localStorage.removeItem(this.lifemonitorUserKey);
    else localStorage.setItem(this.lifemonitorUserKey, 'true');
    if (notify) {
      this.logger.debug('Notifying userSubject', user !== null);
      this.userLoggedSubject.next(user !== null);
      this.userSubject.next(user);
    } else {
      this.logger.debug('Not notifying userSubject');
    }
  }

  protected getCurrentUserData(): any {
    return this._userData;
  }

  protected fetchUserData(): Observable<any> {
    return this._fetchUserData();
  }

  protected _fetchUserData(
    skipIfNone: boolean = false
  ): Observable<User | null> {
    this.logger.warn('fetchUserData', this.baseUrl);
    // fetch current token
    const accessToken = this.getToken();
    const useToken = accessToken !== null && accessToken !== undefined;
    if (skipIfNone) {
      this.logger.debug('_fetchUserData: skipIfNone', skipIfNone);
      // check if user is logged
      const userData = this.isUserLogged();
      // get current path
      const currentPath = window.location.pathname;
      if (
        // if the user flag is not set
        !userData ||
        // or if the access token is not set and the client id is set
        (accessToken === null &&
          this.config.clientId &&
          this.config.clientId !== '<LIFEMONITOR_OAUTH2_CLIENT_ID>') ||
        // or if the current path is the logout page
        currentPath.startsWith('/logout')
      ) {
        this._userData = null;
        this.setUserData(null, true);
        return of(null);
      }
    }
    this.logger.debug('Trying to fetch user data');
    return this.httpClient
      .get(this.baseUrl + '/users/current', {
        withCredentials: !useToken,
        headers: this.getToken()
          ? { Authorization: `Bearer ${accessToken.token.value}` }
          : {},
      })
      .pipe(
        map((data: any) => {
          this.setUserData(data, true);
          this.logger.debug('User data fetched', data);
          return new User(data);
        }),
        catchError((error) => {
          this.logger.warn('Error fetching user data: ', error);
          this.setUserData(null, true);
          return throwError(error);
        })
      );
  }

  public userLoggedAsObservable(): Observable<boolean> {
    return this._userLogged.asObservable();
  }

  public getToken(): Token {
    return this._token;
  }

  get user() {
    return this._user;
  }

  public abstract logout(
    notify: boolean,
    closeSession: boolean
  ): Promise<boolean>;

  public isAuthError(error: any): boolean {
    this.logger.debug('Checking HTTP error: ', error);
    return (
      error.url.startsWith(this.config.apiBaseUrl) &&
      (error.status == 401 ||
        (error.status == 403 &&
          !(
            ('title' in error.error &&
              error.error['title'] === 'Rate Limit Exceeded') ||
            ('detail' in error.error &&
              error.error['detail'] ===
                'User not authorized to get workflow data')
          )) ||
        (error.status == 500 &&
          'extra_info' in error.error &&
          error.error['extra_info']['exception_type'] == 'OAuthError'))
    );
  }
}
