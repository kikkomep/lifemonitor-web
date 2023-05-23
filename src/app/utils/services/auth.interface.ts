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
  logout(notify: boolean): Promise<boolean>;

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
