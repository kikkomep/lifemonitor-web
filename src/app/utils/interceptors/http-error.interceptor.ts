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
import { Logger, LoggerManager } from '../logging';
import { AuthService } from '../services/auth.service';
import { AppConfigService } from '../services/config.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  // initialize logger
  private logger: Logger = LoggerManager.create('HttpErrorInterceptor');

  constructor(
    private appConfig: AppConfigService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
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
