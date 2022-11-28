import { formatDate } from '@angular/common';
import {
  Component, ElementRef, EventEmitter, HostListener, OnInit, Output, Renderer2, ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { DateUtils } from 'src/app/models/common.models';
import { UserNotification } from 'src/app/models/notification.model';
import { Suite } from 'src/app/models/suite.models';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';
import { InputDialogService } from 'src/app/utils/services/input-dialog.service';

@Component({
  selector: 'app-notifications-dropdown-menu',
  templateUrl: './notifications-dropdown-menu.component.html',
  styleUrls: ['./notifications-dropdown-menu.component.scss'],
})
export class NotificationsDropdownMenuComponent implements OnInit {

  @ViewChild('dropdownMenu', { static: false }) dropdownMenu: any;

  @Output() openUserProfile = new EventEmitter<boolean>();

  public notifications: UserNotification[];
  private notificationsByDate: {};

  // initialize logger
  private logger: Logger = LoggerManager.create('NotificationsDropdownMenuComponent');

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private appService: AppService,
    private inputDialog: InputDialogService) { }

  ngOnInit() {
    this.appService.loadNotifications().subscribe((data: UserNotification[]) => {
      this.logger.debug("loaded notifications...", data);
      this.updateNotifications(data);
    })
  }

  @HostListener('document:click', ['$event'])
  clickout(event: { target: any; }) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.hideDropdownMenu();
    }
  }

  private updateNotifications(notifications: UserNotification[]) {
    this.logger.debug("Updating notifications...", notifications);
    this.notifications = notifications.filter(n => n.event !== 'UNCONFIGURED_EMAIL' || !n.read);
    this.notificationsByDate = this.groupNotificationsByDate(this.notifications);
    this.logger.debug("Notifications by date: ", this.notifications);
  }

  public get notificationsToRead(): UserNotification[] {
    if (!this.notifications) return [];
    return this.notifications.filter((n: UserNotification) => !n.read);
  }

  public get notificationDates() {
    return Object.keys(this.notificationsByDate);
  }

  public getNotificationOfDay(day: string) {
    return day in this.notificationsByDate ? this.notificationsByDate[day] : [];
  }

  private groupNotificationsByDate(notifications: UserNotification[]) {
    let result = {};
    for (let n of notifications) {
      let date = formatDate(n.created, 'yyyy-MM-dd', 'en-US');
      if (!(date in result)) {
        result[date] = [];
      }
      result[date].push(n);
    }
    return result;
  }

  public readNotification(n: UserNotification) {
    this.appService.setNotificationsReadingTime([n]).subscribe((data) => {
      this.logger.debug("Notification marked as read", n);
      this.hideDropdownMenu();
    });
    if (n.event === 'UNCONFIGURED_EMAIL') {
      // this.openUserProfile.emit(true);
    } else if (n.event === 'BUILD_FAILED' || n.event === 'BUILD_RECOVERED') {
      let suite: Suite = null;
      if (n.data && "build" in n.data
        && "suite" in n.data["build"]
        && "workflow" in n.data["build"]) {
        suite = this.appService.findTestSuite(
          n.data["build"]["suite"]["uuid"],
          n.data["build"]["workflow"]["uuid"]
        );
      }
      this.logger.debug("Test suite related with notification", suite);
      if (!suite || suite === undefined) {
        this.inputDialog.show({
          iconClass: 'fas fa-exclamation-triangle text-warning',
          question: "Ops...",
          description:
            'Unable to find the test suite related with this notification',
          confirmText: "",
          cancelText: "Close",
        });
      } else {
        return this.navigateTo('/suite', { 's': suite.asUrlParam() });
      }
    }
  }

  public markAllAsRead(notifications: UserNotification[] = null) {
    this.appService.setNotificationsReadingTime(notifications ? notifications : this.notifications)
      .subscribe((data) => {
        this.logger.debug("Notifiations marked as read", notifications);
        this.hideDropdownMenu();
      });
  }

  public deleteNotitification(notification: UserNotification) {
    if (!notification) return;
    if (notification.event === 'UNCONFIGURED_EMAIL')
      this.updateNotifications(
        this.notifications.filter(n => n !== notification)
      )
    else {
      this.appService.deleteNotification(notification)
        .subscribe((data) => {
          this.logger.debug("Notification deleted", notification);
          this.updateNotifications(
            this.notifications.filter(n => n !== notification)
          )
        });
    }
  }

  public deleteAllNotifications() {
    this.appService.deleteNotifications(this.notifications)
      .subscribe(() => {
        this.logger.debug("All notifications deleted", this.notifications);
        this.updateNotifications([]);
        this.hideDropdownMenu();
      });
  }

  public navigateTo(url: string, params: object) {
    return this.router.navigate([url, params]);
  }

  public formatTimestamp(value: string): string {
    return DateUtils.formatTimestamp(value);
  }

  toggleDropdownMenu() {
    if (this.dropdownMenu) {
      if (this.dropdownMenu.nativeElement.classList.contains('show')) {
        this.hideDropdownMenu();
      } else {
        this.showDropdownMenu();
      }
    }
  }

  showDropdownMenu() {
    if (this.dropdownMenu)
      this.renderer.addClass(this.dropdownMenu.nativeElement, 'show');
  }

  hideDropdownMenu() {
    if (this.dropdownMenu)
      this.renderer.removeClass(this.dropdownMenu.nativeElement, 'show');
  }
}
