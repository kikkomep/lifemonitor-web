import { Injectable } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  UrlSegment,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NonAuthGuard implements CanActivate, CanActivateChild, CanLoad {
  constructor(private userService: AppService, private router: Router) {}

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
    return !this.userService.isUserLogged();
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
    return !this.userService.isUserLogged();
  }
  canLoad(
    route: Route,
    segments: UrlSegment[]
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('Can Load');
    return !this.userService.isUserLogged();
  }
}
