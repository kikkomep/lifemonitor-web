import { formatDate } from '@angular/common';
import {
  Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { UserNotification } from 'src/app/models/notification.model';
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

  constructor(
    private router: Router,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private appService: AppService) { }

  ngOnInit() {
    this.appService.loadNotifications().subscribe((data: UserNotification[]) => {
      console.log("loaded notifications...", data);
      this.updateNotifications(data);
    })
  }

  private updateNotifications(notifications: UserNotification[]) {
    console.log("Updating notifications...", notifications);
    this.notifications = notifications;
    this.notificationsByDate = this.groupNotificationsByDate(notifications);
    console.log("Notifications by date: ", this.notifications);
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
      console.log("Notification marked as read", n);
      this.hideDropdownMenu();
    });
  }


  public markAllAsRead(notifications: UserNotification[] = null) {
    this.appService.setNotificationsReadingTime(notifications ? notifications : this.notifications)
      .subscribe((data) => {
        console.log("Notifiations marked as read", notifications);
        this.hideDropdownMenu();
      });
  }

  public deleteAllNotifications() {
    this.appService.deleteNotifications(this.notifications)
      .subscribe(() => {
        console.log("All notifications deleted", this.notifications);
        this.updateNotifications([]);
        this.hideDropdownMenu();
      });
  }


  public navigateTo(url: string, params: object) {
    return this.router.navigate([url, params]);
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
