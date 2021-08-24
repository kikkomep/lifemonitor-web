import { ActivatedRoute, Params, Router } from '@angular/router';
import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AuthService } from '../../utils/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginForm: FormGroup;
  public isAuthLoading = false;
  constructor(
    private renderer: Renderer2,
    private toastr: ToastrService,
    private appService: AuthService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.renderer.addClass(document.querySelector('app-root'), 'login-page');
    this.activatedRoute.queryParams.subscribe((params) => {
      let callback = params['callback'];
      console.log('Callback... ', callback, !callback, callback == 'undefined');
      if (typeof callback === 'undefined') {
        this.appService.login();
      }
    });
  }

  ngOnDestroy() {
    this.renderer.removeClass(document.querySelector('app-root'), 'login-page');
  }
}
