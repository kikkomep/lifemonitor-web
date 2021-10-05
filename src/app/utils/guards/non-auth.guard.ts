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


@Injectable({
  providedIn: 'root',
})
export class NonAuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(private userService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    console.log(
      'Can Activate, ',
      this.userService.user,
      this.userService.isUserLogged()
    );
    console.log('NonAuth can activate: ', !this.userService.isUserLogged());
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
    console.log('Can ActivateChild');
    return !this.userService.isUserLogged()
      ? this.router.createUrlTree(['/dashboard'])
      : true;
  }
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('Can Load');
    return !this.userService.isUserLogged();
  }
}
