import { HttpClient } from '@angular/common/http';
import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { Observable, from, of } from 'rxjs';
import IndexedDb from '../shared/indexdb';
import { AuthBaseService } from './auth-base.service';
import { IAuthService, Token } from './auth.interface';
import { AppConfigService } from './config.service';
import { User } from 'src/app/models/user.modes';

export class AuthOAuth2Service extends AuthBaseService implements IAuthService {
  private _oauth: OAuth2AuthCodePKCE = null;

  constructor(config: AppConfigService, httpClient: HttpClient) {
    super(config, httpClient);
  }

  public async checkIsUserLogged(): Promise<boolean> {
    const token = this.fetchToken();
    return this.fetchToken().then((token) => {
      this.logger.debug('Current token', token);
      if (token && 'token' in token) {
        this._token = token;
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

  // Redirect to auth server and return back to the app
  public async authorize(): Promise<boolean> {
    this.logger.debug('Getting authorization code...');
    await this.oauth.fetchAuthorizationCode();
    return false;
  }

  public async login(): Promise<boolean> {
    this.logger.debug('Is authorized: ', this.oauth.isAuthorized());
    this.logger.debug('Is expired: ', this.oauth.isAccessTokenExpired());

    if (!this.isCallbackFromAuthServer()) {
      this.logger.debug('Redirecting to auth server...');
      return this.authorize();
    } else {
      try {
        let currentToken = await this.fetchToken();
        if (
          !this.oauth.isAuthorized() ||
          !currentToken ||
          this.oauth.isAccessTokenExpired()
        ) {
          const hasAuthCode = await this.oauth.isReturningFromAuthServer();
          if (!hasAuthCode) {
            this.logger.debug('Something wrong...no auth code.');
            throw new Error('Something wrong...no auth code.');
          }
          const token = await this.oauth.getAccessToken();
          return this.saveToken(token).then((value) => {
            this._token = token as Token;
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
          });
        } else {
          if (!currentToken) {
            currentToken = await this.fetchToken();
            this._token = currentToken;
            this.logger.debug('Current token', currentToken);
          }
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
        }
      } catch (error) {
        this.logger.debug(error);
        throw error;
      }
    }
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

  public async logout(notify: boolean = true): Promise<boolean> {
    // if (!this.isCallbackFromAuthServer()) {
    //   this.logger.debug('Returning from AuthServer');
    //   document.location.href = '/api/account/logout?next=/logout?callback';
    // } else {
    return new Promise<boolean>((resolve, reject) => {
      this.logger.debug('Not returning from AuthServer');
      this.deleteToken();
      this._token = null;
      this.oauth.reset();
      localStorage.clear();
      sessionStorage.clear();
      localStorage.removeItem(this.lifemonitorUserKey);
      if (notify) this._userLogged.next(false);
      return resolve(true);
    });
    // }
  }

  public refreshToken() {
    // this.deleteToken().then(() => {
    this.deleteToken();
    this.oauth.reset();
    this._token = null;
    this._userLogged.next(false);
    this.login();
    // });
  }

  public init(): Observable<User> {
    const promise = new Promise<User>(async (resolve, reject) => {
      const token = await this.fetchToken();
      alert('token: ' + token);
      if (token && 'token' in token) {
        this._token = token;
        this._fetchUserData(true).subscribe((user) => {
          resolve(user);
        });
      } else {
        this.setUserData(null, true);
        resolve(null);
      }
    });
    return from(promise);
  }

  private databaseName = 'lifemonitor';
  private objectStoreName = 'oauth';
  private async saveToken(token: any) {
    const db = new IndexedDb(this.databaseName);
    await db.createObjectStore(['oauth']);
    await db.putValue(this.objectStoreName, { ...token, type: 'token' });
  }

  private async fetchToken(): Promise<Token> {
    // return this._token;
    // const token = await this.oauth.getAccessToken();
    const oauthState = localStorage.getItem('oauth2authcodepkce-state');
    if (!oauthState) {
      console.log('No oauth state found');
      return null;
    }
    const token = JSON.parse(oauthState);
    console.log('Fetched Token: ', token);

    this._token = {
      scopes: token.scopes,
      token: token['accessToken'],
    };

    return of(this._token).toPromise();
    // const db = new IndexedDb(this.databaseName);
    // await db.createObjectStore(['oauth']);
    // return await db.getValue(this.objectStoreName, 'token');
  }

  private deleteToken() {
    localStorage.removeItem(this.lifemonitorUserKey);
    this.oauth.reset();
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
