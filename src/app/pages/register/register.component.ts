import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AuthService } from 'src/app/utils/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  public registerForm: FormGroup;
  constructor(
    private renderer: Renderer2,
    private toastr: ToastrService,
    private appService: AuthService
  ) {}

  ngOnInit() {
    this.renderer.addClass(document.querySelector('app-root'), 'register-page');
    this.registerForm = new FormGroup({
      fullName: new FormControl(null, Validators.required),
      email: new FormControl(null, Validators.required),
      password: new FormControl(null, Validators.required),
      retypePassword: new FormControl(null, Validators.required),
    });
  }

  register() {
    if (this.registerForm.valid) {
      this.appService.register();
    } else {
      this.toastr.error('Hello world!', 'Toastr fun!');
    }
  }

  ngOnDestroy() {
    this.renderer.removeClass(
      document.querySelector('app-root'),
      'register-page'
    );
  }
}
