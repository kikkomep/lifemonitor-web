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

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { Logger, LoggerManager } from '../logging';
import { AuthService } from '../services/auth.service';
import { InputDialogService } from '../services/input-dialog.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  // initialize logger
  private logger: Logger = LoggerManager.create('HttpErrorInterceptor');

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private inputDialogService: InputDialogService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        this.logger.error('Error from error interceptor', error);

        // if error code is 401 and the server is the LifeMonitor back-end
        // then try to restart the authentication process
        if (this.authService.isAuthError(error)) {
          this.logger.error('OAuth error detected', error);
          if (!this.authService.isUserLogged()) {
            this.logger.error('User is not logged in');
            alert('User is not logged in');
            return;
          }
          // notify the user
          this.toastr?.error('Session expired', '', { timeOut: 4000 });
          this.logger.debug('Logout from app routing module');
          this.inputDialogService.show({
            question: 'Session Expired',
            description: 'You need to login again to continue',
            confirmText: 'Login',
            iconClass: 'fas fa-user-clock',
            enableCancel: true,
            onConfirm: () => {
              this.logger.debug('Trying to reauthenticate user');
              this.router.navigateByUrl('/logout?callback=&next=/login');
            },
            onCancel: () => {
              this.authService.logout(false, false);
            },
          });
        }
        if (
          !request.headers.has('skip') ||
          request.headers.get('skip') == 'false'
        ) {
          // Show the error message
          //this.toastr.error(`${error.status}: ${error.message}`);
          this.logger.debug(`${error.status}: ${error.message}`, error);
        }

        // show dialog for error message
        //this.errorDialogService.openDialog(error.message ?? JSON.stringify(error), error.status);
        return throwError(error);
      }),
      finalize(() => {
        // hide loading spinner
        //this.loadingDialogService.hideDialog();
      })
    ) as Observable<HttpEvent<any>>;
  }
}
