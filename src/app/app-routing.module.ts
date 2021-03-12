import { NgModule } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import { Routes, RouterModule, Router } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { BlankComponent } from './views/blank/blank.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ProfileComponent } from './views/profile/profile.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { AuthGuard } from './utils/guards/auth.guard';
import { NonAuthGuard } from './utils/guards/non-auth.guard';
import { Subscription } from 'rxjs';

const routes: Routes = [
  {
    path: 'home',
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
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'blank',
        component: BlankComponent,
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
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
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
})
export class AppRoutingModule {
  userLoggedSubscription: Subscription;

  constructor(private appService: AppService, private router: Router) {
    this.userLoggedSubscription = this.appService
      .checkUserLogged()
      .subscribe((userLogged) => {
        if (userLogged) {
          console.info('User logged... redirecting');
          this.handleRedirect('/dashboard');
        } else {
          this.handleRedirect('/home');
          console.info('User logout... redirecting');
        }
      });
  }

  handleRedirect(redirectTo: string = null) {
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
