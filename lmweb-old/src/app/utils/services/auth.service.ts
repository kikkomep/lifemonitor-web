import { Injectable } from '@angular/core';
import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { Observable, Subject } from 'rxjs';
import { Logger, LoggerManager } from '../logging';
import { AppConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user: object = new Subject<boolean>();

  private _userLogged = new Subject<boolean>();

  private _oauth: OAuth2AuthCodePKCE = null;

  // initialize logger
  private logger: Logger = LoggerManager.create('AuthService');

  constructor(private config: AppConfigService) {}

  get oauth(): OAuth2AuthCodePKCE {
    if (!this._oauth) {
      let baseUrl = this.config.getConfig()['apiBaseUrl'];
      this._oauth = new OAuth2AuthCodePKCE({
        extraAuthorizationParams: {
          nonce: this.nonce(64),
        },
        authorizationUrl: baseUrl + '/oauth2/authorize',
        tokenUrl: baseUrl + '/oauth2/token',
        clientId: this.config.getConfig()['clientId'],
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
          alert(
            'We will try to get a new access token via grant code or refresh token.'
          );
          return refreshAccessToken();
        },
        onInvalidGrant(refreshAuthCodeOrRefreshToken) {
          this.logger.debug(
            'Expired! Auth code or refresh token needs to be renewed.'
          );
          alert('Redirecting to auth server to obtain a new auth grant code.');
          //return refreshAuthCodeOrRefreshToken();
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

  public authorize() {
    this.logger.debug('Getting authorization code...');
    this.oauth.fetchAuthorizationCode();
  }

  public login() {
    this.logger.debug('Is authorized: ', this.oauth.isAuthorized());
    this.logger.debug('Is expired: ', this.oauth.isAccessTokenExpired());

    if (!this.oauth.isAuthorized()) {
      this.oauth
        .isReturningFromAuthServer()
        .then(async (hasAuthCode) => {
          if (!hasAuthCode) {
            this.logger.debug('Something wrong...no auth code.');
          }
          const token = await this.oauth.getAccessToken();
          localStorage.setItem('token', JSON.stringify(token));
          this._userLogged.next(true);
          return this.logger.debug('This is the access token: ', token);
        })
        .catch((potentialError) => {
          if (potentialError) {
            this.logger.debug(potentialError);
          }
        });
    } else {
      this._userLogged.next(true);
    }
  }

  public register() {
    return this.authorize();
  }

  public isUserLogged() {
    return localStorage.getItem('token') != null;
  }

  public userLoggedAsObservable(): Observable<boolean> {
    return this._userLogged.asObservable();
  }

  get user() {
    return this._user;
  }

  public logout() {
    this.oauth.reset();
    localStorage.removeItem('token');
    this._userLogged.next(false);
  }
}
