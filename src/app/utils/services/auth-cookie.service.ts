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

  public logout(
    notify: boolean = true,
    closeSession: boolean = true
  ): Promise<boolean> {
    if (closeSession && !this.isCallbackFromAuthServer()) {
      this.logger.debug('Returning from AuthServer');
      document.location.href = '/api/account/logout?next=/logout?callback';
      return Promise.resolve(false);
    } else {
      this.logger.debug('Not returning from AuthServer');
      this._userData = undefined;
      localStorage.clear();
      sessionStorage.clear();
      if (notify) this.userLoggedSubject.next(false);
      return Promise.resolve(true);
    }
  }
}
