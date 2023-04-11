import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/utils/services/auth.service';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
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
export class AppRoutingModule {
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
  ) {
    this.userLoggedSubscription = this.appService.observableUser.subscribe(
      (userLogged) => {
        if (userLogged) {
          this.logger.debug('User logged... redirecting');
          // alert(`Current route: ${this.router.url}`);
          // this.handleRedirect('/dashboard');
        } else {
          this.logger.debug('User logged out...');
          this.toastr.clear();
          this.toastr.success('You have successfully logged out', '', {
            timeOut: 4000,
          });
        }
      }
    );

    this.apiService.onAuthorizationError = (error: FetchError) => {
      this.logger.warn('Authorization error detected', error);
      this.authService.checkIsUserLogged().then((isUserLogged) => {
        if (isUserLogged) {
          this.authService.logout(false).then(() => {
            this.inputDialogService.show({
              question: 'Session Expired',
              description: 'You need to relogin',
              confirmText: 'Login',
              iconClass: 'fas fa-user-clock',
              enableCancel: true,
              onCancel: () => {
                window.location.reload();
              },
              onConfirm: () => {
                this.router.navigateByUrl('/login');
              },
            });
          });
        }
      });
    };

    this.apiService.onError = (error: FetchError) => {
      this.logger.error('Generic error detected', error);
      if (this.configService.developmentMode) {
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

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.userLoggedSubscription.unsubscribe();
  }
}
