import { Injectable } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private userService: AppService, 
    private router: Router) { }

  check(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let pass = this.userService.isUserLogged();
    if (!pass)
      // this.router.navigateByUrl('/login');
      // not logged in so redirect to login page with the return url and return false
      this.router.navigate(['login'], { queryParams: { returnUrl: state.url }});
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
