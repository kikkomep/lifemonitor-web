import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/utils/services/auth.service';
import { Logger, LoggerManager } from '../logging';


@Injectable({
  providedIn: 'root',
})
export class NonAuthGuard implements CanActivate, CanActivateChild, CanLoad {

  // initialize logger
  private logger: Logger = LoggerManager.create('NonAuthGuard');

  constructor(private userService: AuthService, private router: Router) { }

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
    this.logger.debug('NonAuth can activate: ', !this.userService.isUserLogged());
    return !this.userService.isUserLogged()
      ? this.router.createUrlTree(['/home'])
      : true;
  }
  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    this.logger.debug('Can ActivateChild');
    return !this.userService.isUserLogged()
      ? this.router.createUrlTree(['/dashboard'])
      : true;
  }
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    this.logger.debug('Can Load');
    return !this.userService.isUserLogged();
  }
}
