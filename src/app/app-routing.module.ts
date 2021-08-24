import { Router, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './utils/guards/auth.guard';
import { AuthService } from 'src/app/utils/services/auth.service';
import { BlankComponent } from './views/blank/blank.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { MainComponent } from './pages/main/main.component';
import { NgModule } from '@angular/core';
import { NonAuthGuard } from './utils/guards/non-auth.guard';
import { RegisterComponent } from './pages/register/register.component';
import { Subscription } from 'rxjs';
import { WorkflowComponent } from './views/workflow/workflow.component';
import { SuiteComponent } from './views/suite/suite.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [NonAuthGuard],
  },
  {
    path: '',
    component: MainComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'blank',
        component: BlankComponent,
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'workflow',
        component: WorkflowComponent,
      },
      {
        path: 'suite',
        component: SuiteComponent,
      }
    ],
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NonAuthGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [NonAuthGuard],
  },
  { path: '**', redirectTo: '/dashboard' },
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
      .checkUserLogged()
      .subscribe((userLogged) => {
        if (userLogged) {
          console.info('User logged... redirecting');
          this.handleRedirect('/dashboard');
        } else {
          this.handleRedirect('/');
          console.info('User logout... redirecting');
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
