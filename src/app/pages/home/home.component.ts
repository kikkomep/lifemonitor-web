import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { AppService } from '../../utils/services/app.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  public message = null;
  public isAuthLoading = false;
  constructor(
    private renderer: Renderer2,
    private toastr: ToastrService,
    private appService: AppService
  ) {
    this.message = "LifeMonitor HomePage!";
  }

  ngOnInit() {
    this.renderer.addClass(document.querySelector('app-root'), 'home-page');
  }


  ngOnDestroy() {
    this.renderer.removeClass(document.querySelector('app-root'), 'home-page');
  }
}
