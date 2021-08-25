import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AuthService } from '../../utils/services/auth.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginForm: FormGroup;
  public isAuthLoading = false;
  private userLoggedSubscription: Subscription;
  constructor(
    private renderer: Renderer2,
    private toastr: ToastrService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.renderer.addClass(document.querySelector('app-root'), 'login-page');
    this.activatedRoute.queryParams.subscribe((params) => {
      let callback = params['callback'];
      console.log('Callback... ', callback, !callback, callback == 'undefined');
      if (typeof callback === 'undefined') {
        this.toastr.info('Authorizing...');
        this.authService.authorize();
      } else {
        this.toastr.info('Logging in...');
        this.authService.login();
      }
    });

    this.userLoggedSubscription = this.authService
      .userLoggedAsObservable()
      .subscribe((userLogged) => {
        if (userLogged) {
          this.toastr.success('Logging OK');
        } else {
          this.toastr.success('Logged out');
        }
      });
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.querySelector('app-root'), 'login-page');
    if (this.userLoggedSubscription) {
      this.userLoggedSubscription.unsubscribe();
    }
  }
}
