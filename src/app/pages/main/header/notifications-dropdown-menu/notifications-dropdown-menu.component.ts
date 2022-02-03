import { formatDate } from '@angular/common';
import {
  Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { UserNotification } from 'src/app/models/notification.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'app-notifications-dropdown-menu',
  templateUrl: './notifications-dropdown-menu.component.html',
  styleUrls: ['./notifications-dropdown-menu.component.scss'],
})
export class NotificationsDropdownMenuComponent implements OnInit {
  @ViewChild('dropdownMenu', { static: false }) dropdownMenu;

  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.hideDropdownMenu();
    }
  }

  public notifications: UserNotification[];
  private notificationsByDate: {};

  // initialize logger
  private logger: Logger = LoggerManager.create('NotificationsDropdownMenuComponent');

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private appService: AppService) { }

  ngOnInit() {
    this.appService.loadNotifications().subscribe((data: UserNotification[]) => {
      this.logger.debug("loaded notifications...", data);
      this.updateNotifications(data);
    })
  }

  private updateNotifications(notifications: UserNotification[]) {
    this.logger.debug("Updating notifications...", notifications);
    this.notifications = notifications;
    this.notificationsByDate = this.groupNotificationsByDate(notifications);
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

  public setNotificationAsRead(n: UserNotification) {
    this.appService.setNotificationsReadingTime([n]).subscribe((data) => {
      this.logger.debug("Notification marked as read", n);
      this.hideDropdownMenu();
    });
  }


  public markAllAsRead(notifications: UserNotification[] = null) {
    this.appService.setNotificationsReadingTime(notifications ? notifications : this.notifications)
      .subscribe((data) => {
        this.logger.debug("Notifiations marked as read", notifications);
        this.hideDropdownMenu();
      });
  }

  public deleteNotitification(notification: UserNotification) {
    this.appService.deleteNotification(notification)
      .subscribe((data) => {
        this.logger.debug("Notification deleted", notification);
        this.updateNotifications(
          this.notifications.filter(n => n !== notification)
        )
      });
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
    try {
      let timestamp = parseInt(value);
      let d = new Date(timestamp);
      if (d.getFullYear() === 1970)
        timestamp *= 1000;
      return formatDate(timestamp, 'M/d/yy, hh:mm z', 'en-US');
    } catch (e) {
      return value;
    }
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
