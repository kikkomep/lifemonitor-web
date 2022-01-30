import { AppService } from 'src/app/utils/services/app.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AuthService } from '../../utils/services/auth.service';
import { Subscription } from 'rxjs';
import { ActiveToast, ToastrService } from 'ngx-toastr';
import { Logger, LoggerManager } from 'src/app/utils/logging';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginForm: FormGroup;
  public isAuthLoading = false;
  private previousToast: ActiveToast<any> = null;
  private userLoggedSubscription: Subscription;

  // initialize logger
  private logger: Logger = LoggerManager.create('LoginComponent');

  constructor(
    private renderer: Renderer2,
    private toastr: ToastrService,
    private authService: AuthService,
    private appService: AppService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.renderer.addClass(document.querySelector('app-root'), 'login-page');
    this.activatedRoute.queryParams.subscribe((params) => {
      let callback = params['callback'];
      this.logger.debug('Callback... ', callback, !callback, callback == 'undefined');
      if (typeof callback === 'undefined') {
        this.previousToast = this.toastr.info('Authorizing...');
        this.appService.authorize();
      } else {
        this.previousToast = this.toastr.info('Logging in...');
        this.appService.login();
      }
    });

    this.userLoggedSubscription = this.authService
      .userLoggedAsObservable()
      .subscribe((userLogged) => {
        if (this.previousToast) this.toastr.remove(this.previousToast.toastId);
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
