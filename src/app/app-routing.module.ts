import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/utils/services/auth.service';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { MainComponent } from './pages/main/main.component';
import { AuthGuard } from './utils/guards/auth.guard';
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
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
  userLoggedSubscription: Subscription;

  constructor(private authService: AuthService, private router: Router) {
    this.userLoggedSubscription = this.authService
      .userLoggedAsObservable()
      .subscribe((userLogged) => {
        if (userLogged) {
          console.info('User logged... redirecting');
          this.handleRedirect('/dashboard');
        } else {
          console.info('User logged out...');
        }
      });
  }

  handleRedirect(redirectTo: string = null) {
    console.log('RedirectTO: ', redirectTo);
    console.info('Current router state', this.router.routerState);
    // get return url from route parameters or default to '/'
    let returnUrl =
      this.router.routerState.snapshot.root.queryParams['returnUrl'] ||
      redirectTo ||
      '/';
    console.log('ReturnURL: ', returnUrl);
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    }
  }

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.userLoggedSubscription.unsubscribe();
  }
}
