import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { BehaviorSubject, Observable, Subject, throwError } from 'rxjs';
import { Logger, LoggerManager } from '../logging';
import IndexedDb from '../shared/indexdb';
import { AppConfigService } from './config.service';

export interface Token {
  scopes: Array<string>;
  token: {
    value: string;
    expiry: string;
  };
}

export class AuthHandler {
  private _user: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _userLogged: Subject<boolean> = new Subject<boolean>();
  private _isUserLogged: boolean = false;

  private _token: Token;

  private _oauth: OAuth2AuthCodePKCE = null;

  private config: AppConfigService = null;

  // initialize logger
  private logger: Logger = LoggerManager.create('AuthService');

  constructor(config: AppConfigService) {
    this.config = config;
  }

  public async checkIsUserLogged(): Promise<boolean> {
    return this.getToken().then((token) => {
      this.logger.debug('Current token', token);
      if (token && 'token' in token) {
        this._token = token;
        this._isUserLogged = true;
        this.logger.debug('This is the access token: ', token);
        return true;
      }
      return false;
    });
  }

  get oauth(): OAuth2AuthCodePKCE {
    if (!this._oauth) {
      let baseUrl = this.config.apiBaseUrl;
      this._oauth = new OAuth2AuthCodePKCE({
        extraAuthorizationParams: {
          nonce: this.nonce(64),
        },
        authorizationUrl: baseUrl + '/oauth2/authorize',
        tokenUrl: baseUrl + '/oauth2/token',
        clientId: this.config.clientId,
        scopes: [
          'openid',
          'user.profile',
          'user.workflow.read',
          'user.workflow.write',
          'workflow.read',
          'workflow.write',
          'testingService.read',
          'testingService.write',
        ],
        redirectUrl: window.location.origin + '/login?callback',
        onAccessTokenExpiry(refreshAccessToken) {
          this.logger.debug('Expired! Access token needs to be renewed.');
          this.logger.warn(
            'We will try to get a new access token via grant code or refresh token.'
          );
          return refreshAccessToken();
        },
        onInvalidGrant(refreshAuthCodeOrRefreshToken) {
          this.logger.debug(
            'Expired! Auth code or refresh token needs to be renewed.'
          );
          this.logger.debug(
            'Redirecting to auth server to obtain a new auth grant code.'
          );
          return refreshAuthCodeOrRefreshToken();
        },
      });
    }
    return this._oauth;
  }

  private nonce(length: number) {
    let text = '';
    let possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  public async authorize() {
    this.logger.debug('Getting authorization code...');
    return await this.oauth.fetchAuthorizationCode();
  }

  public async login(
    callback: CallableFunction = null,
    catchError: CallableFunction = null
  ) {
    this.logger.debug('Is authorized: ', this.oauth.isAuthorized());
    this.logger.debug('Is expired: ', this.oauth.isAccessTokenExpired());

    try {
      const currentToken = await this.getToken();
      if (
        !this.oauth.isAuthorized() ||
        !currentToken ||
        this.oauth.isAccessTokenExpired()
      ) {
        this.oauth
          .isReturningFromAuthServer()
          .then(async (hasAuthCode) => {
            if (!hasAuthCode) {
              this.logger.debug('Something wrong...no auth code.');
              throw new Error('Something wrong...no auth code.');
            }
            const token = await this.oauth.getAccessToken();
            this.saveToken(token).then((value) => {
              this._token = token as Token;
              this._isUserLogged = true;
              this._userLogged.next(true);
              if (callback) callback();
            });
          })
          .catch((potentialError) => {
            if (potentialError) {
              this.logger.debug(potentialError);
            }
            if (catchError) catchError(potentialError);
            throwError(potentialError);
          });
      } else {
        this.getToken().then((token) => {
          this._token = token;
          this._isUserLogged = true;
          this._userLogged.next(true);
          if (callback) callback();
        });
      }
    } catch (error) {
      this.logger.debug(error);
      throw error;
    }
  }

  public isUserLogged(): boolean {
    return this._isUserLogged;
  }

  public userLoggedAsObservable(): Observable<boolean> {
    return this._userLogged.asObservable();
  }

  get token(): Token {
    return this._token;
  }

  get user() {
    return this._user;
  }

  public async logout(notify: boolean = true) {
    await this.deleteToken();
    this._token = null;
    this.oauth.reset();
    localStorage.clear();
    sessionStorage.clear();
    this._isUserLogged = false;
    if (notify) this._userLogged.next(false);
  }

  public refreshToken() {
    this.deleteToken().then(() => {
      this.oauth.reset();
      this._token = null;
      this._isUserLogged = false;
      this._userLogged.next(false);
      this.login();
    });
  }

  private databaseName = 'lifemonitor';
  private objectStoreName = 'oauth';
  private async saveToken(token: any) {
    const db = new IndexedDb(this.databaseName);
    await db.createObjectStore(['oauth']);
    await db.putValue(this.objectStoreName, { ...token, type: 'token' });
  }

  private async getToken(): Promise<Token> {
    const db = new IndexedDb(this.databaseName);
    await db.createObjectStore(['oauth']);
    return await db.getValue(this.objectStoreName, 'token');
  }

  private async deleteToken() {
    const db = new IndexedDb(this.databaseName);
    await db.createObjectStore(['oauth']);
    return await db.deleteValue(this.objectStoreName, 'token');
  }

  public isOAuthError(error: any): boolean {
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
