import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { AuthBaseService } from './auth-base.service';
import { IAuthService } from './auth.interface';
import { AppConfigService } from './config.service';

export class AuthCookieService extends AuthBaseService implements IAuthService {
  constructor(config: AppConfigService, httpClient: HttpClient) {
    super(config, httpClient);
  }

  public async checkIsUserLogged(): Promise<boolean> {
    this.logger.debug('checkIsUserLogged');
    return Promise.resolve(this.isUserLogged());
  }

  public authorize() {
    this.logger.debug('Redirecting to AuthServer');
    const url = this.baseUrl + '/account/login?next=/login?callback';
    window.location.href = url;
    return Promise.resolve(false);
  }

  public async login(): Promise<boolean> {
    this.logger.debug('Login');
    // if we are not returning from the auth server
    // we need to redirect to the auth server
    if (!this.isCallbackFromAuthServer()) {
      return this.authorize();
    } else {
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
    }
  }

  public logout(notify: boolean = true): Promise<boolean> {
    if (!this.isCallbackFromAuthServer()) {
      this.logger.debug('Returning from AuthServer');
      document.location.href = '/api/account/logout?next=/logout?callback';
    } else {
      this.logger.debug('Not returning from AuthServer');
      localStorage.clear();
      sessionStorage.clear();
      this._userData = undefined;
      localStorage.removeItem(this.lifemonitorUserKey);
      if (notify) this.userLoggedSubject.next(false);
      return of(true).toPromise();
    }
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
