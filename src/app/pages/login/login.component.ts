import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from 'src/app/utils/services/app.service';

import { ActiveToast, ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { User } from 'src/app/models/user.modes';

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
  private queryParamsSubscription: Subscription;

  // initialize logger
  private logger: Logger = LoggerManager.create('LoginComponent');

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private toastr: ToastrService,
    private appService: AppService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.logger.debug('Login component initialization...');
    this.renderer.addClass(document.querySelector('app-root'), 'login-page');
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(
      (params) => {
        let callback = params['callback'];
        this.logger.debug(
          'Callback... ',
          callback,
          !callback,
          callback == 'undefined'
        );
        this.logger.debug('callback is undefined: ', callback === 'undefined');
        this.toastr.clear();
        this.previousToast = this.toastr.info('Authorizing...');
        if (typeof callback === 'undefined') {
          this.logger.debug('Handling authorization');
          this.appService.authorize().then(() => {});
        } else {
          this.logger.debug('Handling login callback');
          this.appService.login().then((data) => {
            this.logger.debug('User logged in...');
            this.appService.loadUserProfile().subscribe((user: User) => {
              this.router.navigateByUrl('/dashboard');
              if (this.previousToast)
                this.toastr.remove(this.previousToast.toastId);
              this.previousToast = this.toastr.success(
                'You have successfully <b>logged in</b>',
                `Hi, ${user.username}`,
                {
                  enableHtml: true,
                  timeOut: 4000,
                }
              );
            });
          });
        }
      }
    );
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.querySelector('app-root'), 'login-page');
    if (this.userLoggedSubscription) {
      this.userLoggedSubscription.unsubscribe();
    }
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }
  }
}
