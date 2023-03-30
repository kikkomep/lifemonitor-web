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
    this.renderer.addClass(document.querySelector('app-root'), 'login-page');
    this.activatedRoute.queryParams.subscribe((params) => {
      let callback = params['callback'];
      this.logger.debug(
        'Callback... ',
        callback,
        !callback,
        callback == 'undefined'
      );
      if (typeof callback === 'undefined') {
        this.appService.authorize().then(() => {
          this.toastr.clear();
          this.previousToast = this.toastr.info('Authorizing...');
        });
      } else {
        this.appService.login(() => {
          this.appService.loadUserProfile().subscribe((user: User) => {
            this.router.navigateByUrl('/dashboard');
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
    });
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.querySelector('app-root'), 'login-page');
    if (this.userLoggedSubscription) {
      this.userLoggedSubscription.unsubscribe();
    }
  }
}
