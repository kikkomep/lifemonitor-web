/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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
        this.appService.login().then((logged) => {
          if (logged) {
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
          }
        });
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
