import { AppConfigService } from './config.service';
import { Location, LocationStrategy } from '@angular/common';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user: object = new Subject<boolean>();

  private _userLogged = new Subject<boolean>();

  private oauth: OAuth2AuthCodePKCE = null;

  constructor(
    private http: HttpClient,
    private location: Location,
    private config: AppConfigService,
    private locationStrategy: LocationStrategy
  ) {
    let baseUrl = this.config.getConfig()['apiBaseUrl'];

    this.oauth = new OAuth2AuthCodePKCE({
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
        console.log('Expired! Access token needs to be renewed.');
        alert(
          'We will try to get a new access token via grant code or refresh token.'
        );
        return refreshAccessToken();
      },
      onInvalidGrant(refreshAuthCodeOrRefreshToken) {
        console.log('Expired! Auth code or refresh token needs to be renewed.');
        alert('Redirecting to auth server to obtain a new auth grant code.');
        //return refreshAuthCodeOrRefreshToken();
      },
    });

    console.log('Is authorized: ', this.oauth.isAuthorized());
    console.log('Is expired: ', this.oauth.isAccessTokenExpired());

    // console.log('', this.oauth.getAccessToken());

    // if (this.oauth.isAuthorized()) {
    //   this.get_workflows();
    // }

    // this.oauth.getAccessToken()..then((token) => {
    //   console.log('This is the access token: ',token);
    // });
    if (!this.oauth.isAuthorized()) {
      this.oauth
        .isReturningFromAuthServer()
        .then(async (hasAuthCode) => {
          if (!hasAuthCode) {
            console.log('Something wrong...no auth code.');
          }
          const token = await this.oauth.getAccessToken();
          localStorage.setItem('token', JSON.stringify(token));
          this._userLogged.next(true);
          return console.log('This is the access token: ', token);
        })
        .catch((potentialError) => {
          if (potentialError) {
            console.log(potentialError);
          }
        });
    } else {
      this._userLogged.next(true);
    }
  }

  nonce(length: number) {
    let text = '';
    let possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  login() {
    this.oauth.fetchAuthorizationCode();
  }

  register() {
    return this.login();
  }

  isUserLogged() {
    return localStorage.getItem('token') != null;
  }

  checkUserLogged(): Observable<boolean> {
    return this._userLogged.asObservable();
  }

  get user() {
    return this._user;
  }

  logout() {
    this.oauth.reset();
    localStorage.removeItem('token');
    this._userLogged.next(false);
  }
}
