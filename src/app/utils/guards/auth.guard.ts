import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { AuthService } from 'src/app/utils/services/auth.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private userService: AuthService,
    private router: Router) { }

  check(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let pass = this.userService.isUserLogged();
    if (!pass)
      // this.router.navigateByUrl('/login');
      // not logged in so redirect to login page with the return url and return false
      //this.router.navigate(['login'], { queryParams: { returnUrl: state.url }});
      console.log("User not logged!");
    return pass;
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    console.log("Can Activate, ", this.userService.user, this.userService.isUserLogged());
    return this.check(next, state);
  }
  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    console.log("Can Activate Child ", this.userService.user, this.userService.isUserLogged());
    return this.check(next, state);
  }
}
