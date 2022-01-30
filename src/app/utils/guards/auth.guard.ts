import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/utils/services/auth.service';
import { Logger, LoggerManager } from '../logging';


@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {

  // initialize logger
  private logger: Logger = LoggerManager.create('AuthGuard');

  constructor(private userService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    this.logger.debug(
      'Can Activate, ',
      this.userService.user,
      this.userService.isUserLogged()
    );
    if (!this.userService.isUserLogged())
      return this.router.createUrlTree(['/home']);
    return true;
  }
  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    this.logger.debug(
      'Can Activate Child ',
      this.userService.user,
      this.userService.isUserLogged()
    );
    if (!this.userService.isUserLogged())
      return this.router.createUrlTree(['/home']);
    return true;
  }
}
