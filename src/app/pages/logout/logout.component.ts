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
        this.appService.logout().then((data) => {
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
