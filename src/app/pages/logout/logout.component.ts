import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {
  // initialize logger
  private logger: Logger = LoggerManager.create('LoginComponent');

  constructor(
    private appService: AppService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.appService.checkIsUserLogged().then((logged) => {
      if (logged) {
        this.appService.logout(false).then((data) => {
          this.logger.debug('User logged out...');
          this.redirectToDashboard(true);
        });
      } else this.redirectToDashboard(false);
    });
  }

  redirectToDashboard(backend: boolean): void {
    this.toastr.clear();
    this.toastr.success('You have successfully logged out', '', {
      timeOut: 4000,
    });
    setTimeout(() => {
      if (backend) {
        document.location.href = '/api/account/logout';
      } else {
        this.router.navigateByUrl('/dashboard');
      }
    }, 500);
  }
}
