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
import { catchError, finalize, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AppConfigService } from '../services/config.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private appConfig: AppConfigService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  private isOAuthError(error: HttpErrorResponse): boolean {
    console.error('Checking HTTP error: ', error);
    return (
      error.url.startsWith(this.appConfig.getConfig()['apiBaseUrl']) &&
      (error.status == 401 ||
        error.status == 403 ||
        (error.status == 500 &&
          'extra_info' in error.error &&
          error.error['extra_info']['exception_type'] == 'OAuthError'))
    );
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // show loading spinner
    //this.loadingDialogService.openDialog();

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error from error interceptor', error);

        // if error code is 401 and the server is the LifeMonitor back-end
        // then try to restart the authentication process
        if (this.isOAuthError(error)) {
          console.log('Trying to reauthenticate user');
          // clear user session
          this.authService.logout();
          // force authentication process
          return next.handle(request).pipe(
            tap(
              () => {},
              (err: any) => {
                if (err instanceof HttpErrorResponse) {
                  if (!this.isOAuthError(err)) {
                    return;
                  }
                  this.router.navigateByUrl('/login');
                }
              }
            )
          );
        }
        // Show the error message
        this.toastr.error(`${error.status}: ${error.message}`);
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
