import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { AppConfigService } from './../../../../utils/services/config.service';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/user.modes';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'app-user-dropdown-menu',
  templateUrl: './user-dropdown-menu.component.html',
  styleUrls: ['./user-dropdown-menu.component.scss'],
})
export class UserDropdownMenuComponent implements OnInit, OnDestroy {
  public user: User;
  private userSubscription: Subscription;

  // initialize logger
  private logger: Logger = LoggerManager.create('UserDropdownMenuComponent');

  @ViewChild('dropdownMenu', { static: false }) dropdownMenu;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.hideDropdownMenu();
    }
  }

  constructor(
    private appService: AppService,
    private config: AppConfigService,
    private router: Router,
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.appService.observableUser.subscribe(
      (user: User) => {
        this.user = user;
        this.logger.debug('Current user', user, this.appService.isUserLogged());
      }
    );
  }

  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
  }

  toggleDropdownMenu() {
    if (this.dropdownMenu.nativeElement.classList.contains('show')) {
      this.hideDropdownMenu();
    } else {
      this.showDropdownMenu();
    }
  }

  public get profileUrl(): string {
    return this.config.apiBaseUrl + '/account/profile?back=true';
  }

  public openProfile() {
    this.hideDropdownMenu();
    window.open(this.profileUrl);
  }

  showDropdownMenu() {
    this.renderer.addClass(this.dropdownMenu.nativeElement, 'show');
  }

  hideDropdownMenu() {
    this.renderer.removeClass(this.dropdownMenu.nativeElement, 'show');
  }

  logout() {
    this.router.navigateByUrl('/logout');
  }
}
