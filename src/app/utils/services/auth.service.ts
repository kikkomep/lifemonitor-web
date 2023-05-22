import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { User } from 'src/app/models/user.modes';
import { Logger, LoggerManager } from '../logging';
import { AuthCookieService } from './auth-cookie.service';
import { IAuthService } from './auth.interface';
import { AppConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements IAuthService {
  // Set reference to currently running auth instance
  protected _currentAuthInstance: IAuthService = null;

  // initialize logger
  private logger: Logger = LoggerManager.create('AuthService');

  constructor(
    private config: AppConfigService,
    private httpClient: HttpClient,
    private cookieService: CookieService
  ) {}

  get currentAuthInstance(): IAuthService {
    if (this._currentAuthInstance === null) {
      // Use AuthCookieService if no clientId is set
      if (
        !this.config.clientId ||
        this.config.clientId.startsWith('<LIFEMONITOR_OAUTH2_CLIENT_ID>')
      ) {
        this.logger.debug('Using AuthCookieService');
        this._currentAuthInstance = new AuthCookieService(
          this.config,
          this.httpClient
        );
      } else {
        // Use AuthOauth2Service if clientId is set
        this.logger.debug('Using AuthOauth2Service');
      }
    }
    // If no auth instance is available, throw an error
    if (!this._currentAuthInstance) {
      throw new Error('No auth instance available');
    }
    // Return the current auth instance
    return this._currentAuthInstance;
  }

  public init(): Observable<any> {
    return this.currentAuthInstance.init();
  }

  public authorize() {
    const as = this.currentAuthInstance as AuthCookieService;
    return as.authorize();
  }

  public getToken(): { value: string } {
    return this.currentAuthInstance.getToken();
  }

  public getCurrentUser(): User {
    return this.currentAuthInstance.getCurrentUser();
  }

  public getCurrentUser$(): Observable<User> {
    return this.currentAuthInstance.getCurrentUser$();
  }

  public checkIsUserLogged(): Promise<boolean> {
    return this.currentAuthInstance.checkIsUserLogged();
  }

  public isUserLogged(): boolean {
    return this.currentAuthInstance.isUserLogged();
  }

  public userLogged$(): Observable<boolean> {
    return this.currentAuthInstance.userLogged$();
  }

  public login(): Promise<boolean> {
    return this.currentAuthInstance.login();
  }

  public logout(notify: boolean = true): Promise<boolean> {
    return this.currentAuthInstance.logout(notify);
  }

  public isAuthError(error: any): boolean {
    return this.currentAuthInstance.isAuthError(error);
  }
}
