import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { AuthService } from 'src/app/utils/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  public registerForm: UntypedFormGroup;
  constructor(
    private renderer: Renderer2,
    private toastr: ToastrService,
    private appService: AuthService
  ) {}

  ngOnInit() {
    this.renderer.addClass(document.querySelector('app-root'), 'register-page');
    this.registerForm = new UntypedFormGroup({
      fullName: new UntypedFormControl(null, Validators.required),
      email: new UntypedFormControl(null, Validators.required),
      password: new UntypedFormControl(null, Validators.required),
      retypePassword: new UntypedFormControl(null, Validators.required),
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
