import { NgModule, OnInit } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/utils/services/auth.service';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { LogoutComponent } from './pages/logout/logout.component';
import { MainComponent } from './pages/main/main.component';
import { Logger, LoggerManager } from './utils/logging';
import { ApiService } from './utils/services/api.service';
import { AppService } from './utils/services/app.service';
import { FetchError } from './utils/services/cache/cache-manager';
import { AppConfigService } from './utils/services/config.service';
import { InputDialogService } from './utils/services/input-dialog.service';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { SuiteComponent } from './views/suite/suite.component';
import { WorkflowComponent } from './views/workflow/workflow.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: '',
    component: MainComponent,
    // canActivate: [AuthGuard],
    // canActivateChild: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        pathMatch: 'full',
      },
      {
        path: 'workflow',
        component: WorkflowComponent,
      },
      {
        path: 'suite',
        component: SuiteComponent,
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
  // {
  //   path: 'register',
  //   component: RegisterComponent,
  //   canActivate: [NonAuthGuard],
  // },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      relativeLinkResolution: 'legacy',
      // onSameUrlNavigation: 'reload',
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule implements OnInit {
  userLoggedSubscription: Subscription;

  private logger: Logger = LoggerManager.create('AppRoutingModule');

  constructor(
    private configService: AppConfigService,
    private authService: AuthService,
    private apiService: ApiService,
    private appService: AppService,
    private router: Router,
    private inputDialogService: InputDialogService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.logger.debug('Initializing app routing module');
    this.init();
  }

  public init() {
    this.userLoggedSubscription = this.appService.observableUser.subscribe(
      (userLogged) => {
        if (userLogged) {
          this.logger.debug('User logged... redirecting');
        } else {
          this.logger.debug('User logged out...');
        }
      }
    );

    this.apiService.onAuthorizationError = this.handleAuthError;

    this.apiService.onError = async (error: FetchError, response: Response) => {
      this.logger.error('Generic error detected', error, response);
      if (error.status === 401) {
        this.handleAuthError(error);
      } else if (
        error.status === 503 &&
        error.statusText.match(/service unavailable/i)
      ) {
        const serviceDetails = await response?.json();
        console.warn(
          serviceDetails?.extra_info?.service || error,
          'External service unavailable'
        );
        this.toastr.warning(
          'Service Unavailable',
          serviceDetails?.extra_info?.service || error,
          {
            timeOut: 4000,
          }
        );
      } else {
        if (this.configService.developmentMode) {
          this.toastr.error('Something went wrong', '', { timeOut: 4000 });
          this.inputDialogService.show({
            question: 'Ops...',
            description: 'Something went wrong!',
            confirmText: '',
            cancelText: 'Close',
            iconClass: 'fas fa-exclamation-triangle',
            enableCancel: false,
            onCancel: () => {},
          });
        }
      }
    };
  }

  handleRedirect(redirectTo: string = null) {
    this.logger.debug('RedirectTO: ', redirectTo);
    this.logger.debug('Current router state', this.router.routerState);
    // get return url from route parameters or default to '/'
    let returnUrl =
      this.router.routerState.snapshot.root.queryParams['returnUrl'] ||
      redirectTo ||
      '/';
    this.logger.debug('ReturnURL: ', returnUrl);
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    }
  }

  handleAuthError(error: FetchError) {
    this.logger.warn('Authorization error detected', error);
    this.authService.checkIsUserLogged().then((isUserLogged) => {
      if (isUserLogged) {
        this.toastr?.error('Session expired', '', { timeOut: 4000 });
      }
      this.appService.logout().then(() => {
        this.logger.debug('Logout from app routing module');
        this.inputDialogService.show({
          question: 'Session Expired',
          description: 'You need to login again to continue',
          confirmText: 'Login',
          iconClass: 'fas fa-user-clock',
          enableCancel: true,
          // onCancel: () => {
          //   window.location.reload();
          // },
          // onConfirm: () => {
          //   this.router.navigateByUrl('/dashboard');
          // },
        });
      });
      setTimeout(() => {
        this.router.navigate(['/logout'], {
          queryParams: { next: '/login' },
        });
      }, 1500);
    });
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.userLoggedSubscription.unsubscribe();
  }
}
