import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from 'src/app/models/user.modes';
import { Logger, LoggerManager } from '../logging';

import { IAuthService } from './auth.interface';
import { AppConfigService } from './config.service';

export class AuthCookieService implements IAuthService {
  // reference to the http client
  private httpClient: HttpClient = null;
  // reference to the config service
  protected config: AppConfigService = null;

  // key used to store a flag in the local storage
  private lifemonitorUserKey: string = 'lifemonitor-user';

  // reference to the user data
  private _userData: any = null;

  // reference to the token: always null for this service
  private _token = null;

  // initialize logger
  private logger: Logger = LoggerManager.create('AuthCookieService');

  // initialize the user logged subject
  private userLoggedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    undefined
  );
  // initialize the user subject
  private userSubject: BehaviorSubject<User> = new BehaviorSubject<User>(
    undefined
  );

  constructor(config: AppConfigService, httpClient: HttpClient) {
    this.config = config;
    this.httpClient = httpClient;
  }

  public init(): Observable<User | null> {
    return this._fetchUserData(true);
  }

  public getToken(): any {
    return this._token;
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

  public async checkIsUserLogged(): Promise<boolean> {
    this.logger.debug('checkIsUserLogged');
    return Promise.resolve(this.isUserLogged());
  }

  public userLogged$(): Observable<boolean> {
    return this.userLoggedSubject.asObservable();
  }

  public authorize() {
    const url = this.baseUrl + '/account/login?next=/login?callback';
    window.location.href = url;
  }

  public async login(): Promise<boolean> {
    this.logger.debug('Login');
    if (this.isReturningFromAuthServer()) {
      this.logger.debug('Returning from AuthServer');

      return this.fetchUserData()
        .toPromise()
        .then((data) => {
          this.logger.debug('User is logged');
          return true;
        })
        .catch((error) => {
          this.logger.error('Error fetching user data: ', error);
          return false;
        });
    } else {
      this.logger.debug('Not returning from AuthServer');
      alert('Not returning from AuthServer');
    }
    alert('Returning false');
    return false;
  }

  public logout(notify: boolean = true): Promise<boolean> {
    if (!this.isReturningFromAuthServer()) {
      this.logger.debug('Returning from AuthServer');
      document.location.href = '/api/account/logout?next=/logout?callback';
    } else {
      this.logger.debug('Not returning from AuthServer');
      localStorage.clear();
      sessionStorage.clear();
      this._userData = undefined;
      localStorage.removeItem('user');
      if (notify) this.userLoggedSubject.next(false);
      return of(true).toPromise();
    }
  }

  private get baseUrl(): string {
    return this.config.apiBaseUrl;
  }

  private isReturningFromAuthServer(): boolean {
    // extract callback param from url query string
    const urlParams = new URLSearchParams(window.location.search);
    const hasCallbackParam = urlParams.has('callback');
    this.logger.debug('Is Returning from AuthServer: ' + hasCallbackParam);
    return hasCallbackParam;
  }

  private setUserData(user: User | null, notify: boolean = false) {
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

  private getCurrentUserData(): any {
    return this._userData;
  }

  private fetchUserData(): Observable<any> {
    return this._fetchUserData();
  }

  private _fetchUserData(skipIfNone: boolean = false): Observable<User | null> {
    this.logger.warn('fetchUserData', this.baseUrl);
    if (skipIfNone) {
      this.logger.debug('_fetchUserData: skipIfNone', skipIfNone);
      const userData = this.isUserLogged();
      if (!userData || window.location.pathname.startsWith('/logout')) {
        this._userData = null;
        this.setUserData(null, true);
        return of(null);
      }
    }
    this.logger.debug('Trying to fetch user data');
    return this.httpClient
      .get(this.baseUrl + '/users/current', { withCredentials: true })
      .pipe(
        map((data: any) => {
          // this._userData = data;
          this.setUserData(data, true);
          this.logger.debug('User data fetched', data);
          return new User(data);
        }),
        catchError((error) => {
          this.logger.warn('[X] Error fetching user data: ', error);
          // this._userData = null;
          this.setUserData(null, true);
          return throwError(error);
        })
      );
  }

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
