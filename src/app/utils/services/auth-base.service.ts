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
    if (skipIfNone) {
      this.logger.debug('_fetchUserData: skipIfNone', skipIfNone);
      const userData = this.isUserLogged();
      const currentPath = window.location.pathname;
      if (!userData || currentPath.startsWith('/logout')) {
        this._userData = null;
        this.setUserData(null, true);
        return of(null);
      }
    }
    this.logger.debug('Trying to fetch user data');
    return this.httpClient
      .get(this.baseUrl + '/users/current', {
        withCredentials: !this.getToken() ? true : false,
        headers: this.getToken()
          ? { Authorization: `Bearer ${this.getToken().token.value}` }
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

  public abstract logout(notify: boolean): Promise<boolean>;

  public abstract isAuthError(error: any): boolean;
}
