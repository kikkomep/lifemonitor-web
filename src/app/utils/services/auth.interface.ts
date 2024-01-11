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

import { Observable } from 'rxjs';
import { User } from 'src/app/models/user.modes';

/**
 * @export
 * @interface Token
 * @description
 * This interface represents a token.
 * It contains the scopes and the token value.
 * The token value is a string and the scopes are an array of strings.
 */
export interface Token {
  scopes: Array<string>;
  token: {
    value: string;
    expiry: string;
  };
}

/**
 *
 * @export
 * @class AuthCookieService
 * @implements {IAuthService}
 * @description
 * This class implements the IAuthService interface.
 */
export interface IAuthService {
  /**
   * @returns {Promise<User | null>}
   * @memberof IAuthService
   * @description
   * This method initializes the service.
   * It should be called when the application starts.
   * It returns a promise that resolves to the current user.
   * If the user is not logged in, it will resolve to null.
   * If the user is logged in, it will resolve to the user.
   */
  init(): Observable<User | null>;

  /**
   * @returns {Promise<User | null>}
   * @memberof IAuthService
   * @description
   * This method returns the current user.
   * If the user is not logged in, it will return null.
   * If the user is logged in, it will return the user.
   */
  getCurrentUser(): User;

  /**
   * @returns {Observable<User| null>}
   * @memberof IAuthService
   * @description
   * This method returns an observable that emits the current user.
   * If the user is not logged in, it will emit null.
   */
  getCurrentUser$(): Observable<User | null>;

  /**
   * @returns {Promise<boolean>}
   * @memberof IAuthService
   * @description
   * This method checks if the user is logged in.
   * If the user is logged in, it will return true.
   * If the user is not logged in, it will return false.
   */
  checkIsUserLogged(): Promise<boolean>;

  /**
   * @returns {boolean}
   * @memberof IAuthService
   * @description
   * This method returns true if the user is logged in, false otherwise.
   */
  isUserLogged(): boolean;

  /**
   * @returns {Observable<boolean>}
   * @memberof IAuthService
   * @description
   * This method returns an observable that emits true if the user is logged in, false otherwise.
   */
  userLogged$(): Observable<boolean>;

  /**
   * Authorize the user
   * @returns {Promise<boolean>}
   * @memberof IAuthService
   * @description
   * This method should be called when the user is not logged in.
   * It will redirect the user to the authorization page.
   * If the user is already logged in, it will return true.
   * If the user is not logged in, it will return false.
   */
  login(): Promise<boolean>;
  /**
   * Logout the user
   * @param {boolean} [notify=true]
   * @returns {Promise<boolean>}
   * @memberof IAuthService
   * @description
   * This method should be called when the user is logged in.
   * It will redirect the user to the logout page.
   * If the user is already logged out, it will return true.
   * If the user is not logged out, it will return false.
   * If notify is true, it will notify the current user is changed.to null.
   */
  logout(notify: boolean, closeSession: boolean): Promise<boolean>;

  /**
   * @returns {string}
   * @memberof IAuthService
   * @description
   * This method returns the authentication token.
   * If the user is not logged in or the token is not available, it will return null.
   */
  getToken(): Token;

  /**
   * @returns {boolean}
   * @memberof IAuthService
   * @description
   * This method returns true if the error is an authentication error, false otherwise.
   */
  isAuthError(error: any): boolean;
}
