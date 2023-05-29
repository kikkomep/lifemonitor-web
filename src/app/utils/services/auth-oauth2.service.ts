import { HttpClient } from '@angular/common/http';
import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { Observable } from 'rxjs';
import { User } from 'src/app/models/user.modes';
import { AuthBaseService } from './auth-base.service';
import { IAuthService, Token } from './auth.interface';
import { AppConfigService } from './config.service';

export class AuthOAuth2Service extends AuthBaseService implements IAuthService {
  private _oauth: OAuth2AuthCodePKCE = null;

  constructor(config: AppConfigService, httpClient: HttpClient) {
    super(config, httpClient);
  }

  public async checkIsUserLogged(): Promise<boolean> {
    const token = this.fetchToken();
    return new Promise((resolve, reject) => {
      this.logger.debug('Current token', token);
      if (token && 'token' in token) {
        this._token = token;
        this.logger.debug('This is the access token: ', token);
        return resolve(true);
      }
      return resolve(false);
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
    }
    try {
      let currentToken = this.fetchToken();
      if (!this.oauth.isAuthorized() || this.oauth.isAccessTokenExpired()) {
        const hasAuthCode = await this.oauth.isReturningFromAuthServer();
        if (!hasAuthCode) {
          this.logger.debug('Something wrong...no auth code.');
          throw new Error('Something wrong...no auth code.');
        }
        this.logger.debug('Getting access token...');
        await this.oauth.getAccessToken(); // Fetches the access token and stores it in the local storage
        this._token = this.fetchToken();
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
    } catch (error) {
      this.logger.debug(error);
      throw error;
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

  public async logout(
    notify: boolean = true,
    closeSession: boolean = true
  ): Promise<boolean> {
    if (closeSession && !this.isCallbackFromAuthServer()) {
      this.logger.debug('Returning from AuthServer');
      document.location.href = '/api/account/logout?next=/logout?callback';
    } else {
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
    }
  }

  public refreshToken() {
    this.deleteToken();
    this.oauth.reset();
    this._token = null;
    this._userLogged.next(false);
    this.login();
  }

  public init(): Observable<User> {
    const token = this.fetchToken();
    if (token && 'token' in token) {
      this._token = token;
    }
    return this._fetchUserData(true);
  }

  private fetchToken(): Token {
    const oauthState = localStorage.getItem('oauth2authcodepkce-state');
    if (!oauthState) {
      this.logger.debug('No oauth state found');
      return null;
    }
    const token = JSON.parse(oauthState);
    this.logger.log('Fetched Token: ', token);
    if (!token || !('accessToken' in token)) {
      this.logger.debug('No access token found');
      return null;
    }

    this._token = {
      scopes: token.scopes,
      token: token['accessToken'],
    };
    return this._token;
  }

  private deleteToken() {
    localStorage.removeItem(this.lifemonitorUserKey);
    this.oauth.reset();
  }
}
