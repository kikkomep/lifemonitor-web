import { AppConfigService } from './../../../../utils/services/config.service';
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';

import { ApiService } from 'src/app/utils/services/api.service';
import { AuthService } from 'src/app/utils/services/auth.service';
import { User } from 'src/app/models/user.modes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dropdown-menu',
  templateUrl: './user-dropdown-menu.component.html',
  styleUrls: ['./user-dropdown-menu.component.scss'],
})
export class UserDropdownMenuComponent implements OnInit {
  public user: User;

  @ViewChild('dropdownMenu', { static: false }) dropdownMenu;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.hideDropdownMenu();
    }
  }

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private authService: AuthService,
    private apiService: ApiService,
    private config: AppConfigService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiService.get_current_user().subscribe((data) => {
      console.log('Current user', data);
      this.user = data;
    });
  }

  toggleDropdownMenu() {
    if (this.dropdownMenu.nativeElement.classList.contains('show')) {
      this.hideDropdownMenu();
    } else {
      this.showDropdownMenu();
    }
  }

  public get profileUrl(): string {
    return (
      this.config.getConfig()['apiBaseUrl'] +
      '/profile?back=' +
      btoa(
        JSON.stringify({
          url: decodeURI(location.href),
          title: 'Back to LifeMonitor Web',
        })
      )
    );
  }

  showDropdownMenu() {
    this.renderer.addClass(this.dropdownMenu.nativeElement, 'show');
  }

  hideDropdownMenu() {
    this.renderer.removeClass(this.dropdownMenu.nativeElement, 'show');
  }

  logout() {
    this.authService.logout();
    console.info('User logout... redirecting');
    this.router.navigateByUrl('/home');
  }
}
