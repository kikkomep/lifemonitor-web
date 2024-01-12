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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit, OnDestroy {
  // initialize logger
  private logger: Logger = LoggerManager.create('LoginComponent');
  private queryParamsSubscription: Subscription;
  constructor(
    private appService: AppService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.queryParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
        this.logger.debug('Query params: ', params);
        let nextRoute = '/dashboard';
        if ('next' in params) {
          // Parse and normalize next route path
          nextRoute = params['next'];
        }
        this.logger.debug(`Next route: ${nextRoute}`);
        this.appService.logout().then(() => {
          this.logger.debug('User logged out...');
          this.redirectTo(nextRoute, false);
        });
      }
    );
  }

  redirectTo(route: string, backend: boolean): void {
    this.toastr.clear();
    this.toastr.success('You have successfully logged out', '', {
      timeOut: 4000,
    });
    setTimeout(() => {
      if (backend) {
        document.location.href = `/api/account/logout?next=${route}`;
      } else {
        this.router.navigateByUrl(route);
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription)
      this.queryParamsSubscription.unsubscribe();
  }
}
