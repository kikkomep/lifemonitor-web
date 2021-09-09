import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AggregatedStatusStats } from 'src/app/models/stats.model';
import { User } from 'src/app/models/user.modes';
import { ApiService } from 'src/app/utils/services/api.service';
import { AppService } from './../../utils/services/app.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  public sidebarMenuOpened = true;
  @ViewChild('contentWrapper', { static: false }) contentWrapper;
  private userLoggedSubscription: any;

  public user: User;
  // reference to workflows stats
  public workflows: AggregatedStatusStats | null;

  // reference to the current subscription
  private workflowsStatsSubscription: Subscription;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private apiService: ApiService,
    private appService: AppService
  ) {
    this.userLoggedSubscription = this.apiService
      .get_current_user()
      .subscribe((data) => {
        console.log('Current user', data);
        this.user = data;
      });

    this.workflowsStatsSubscription = this.appService.observableWorkflows.subscribe(
      (data) => {
        this.workflows = data;
        console.log('Stats', data);
      }
    );
    // reload workflows (using cache)
    this.appService.loadWorkflows(true);
  }

  ngOnInit() {
    this.renderer.removeClass(document.querySelector('app-root'), 'login-page');
    this.renderer.removeClass(
      document.querySelector('app-root'),
      'register-page'
    );

    this.router.events
      .pipe(
        // The "events" stream contains all the navigation events. For this demo,
        // though, we only care about the NavigationStart event as it contains
        // information about what initiated the navigation sequence.
        filter((event: any) => {
          return event instanceof NavigationStart;
        })
      )
      .subscribe((event: NavigationStart) => {
        console.group('NavigationStart Event');
        console.log('event', event);
        // Every navigation sequence is given a unique ID. Even "popstate"
        // navigations are really just "roll forward" navigations that get
        // a new, unique ID.
        console.log('navigation id:', event.id);
        console.log('route:', event.url);
        // The "navigationTrigger" will be one of:
        // --
        // - imperative (ie, user clicked a link).
        // - popstate (ie, browser controlled change such as Back button).
        // - hashchange
        // --
        // NOTE: I am not sure what triggers the "hashchange" type.
        console.log('trigger:', event.navigationTrigger);
        // This "restoredState" property is defined when the navigation
        // event is triggered by a "popstate" event (ex, back / forward
        // buttons). It will contain the ID of the earlier navigation event
        // to which the browser is returning.
        // --
        // CAUTION: This ID may not be part of the current page rendering.
        // This value is pulled out of the browser; and, may exist across
        // page refreshes.
        if (event.restoredState) {
          console.warn(
            'restoring navigation id:',
            event.restoredState.navigationId
          );
        }
        console.groupEnd();
      });
  }

  mainSidebarHeight(height) {
    // this.renderer.setStyle(
    //   this.contentWrapper.nativeElement,
    //   'min-height',
    //   height - 114 + 'px'
    // );
  }

  toggleMenuSidebar() {
    if (this.sidebarMenuOpened) {
      this.renderer.removeClass(
        document.querySelector('app-root'),
        'sidebar-open'
      );
      this.renderer.addClass(
        document.querySelector('app-root'),
        'sidebar-collapse'
      );
      this.sidebarMenuOpened = false;
    } else {
      this.renderer.removeClass(
        document.querySelector('app-root'),
        'sidebar-collapse'
      );
      this.renderer.addClass(
        document.querySelector('app-root'),
        'sidebar-open'
      );
      this.sidebarMenuOpened = true;
    }
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    if (this.userLoggedSubscription) this.userLoggedSubscription.unsubscribe();
    if (this.workflowsStatsSubscription)
      this.workflowsStatsSubscription.unsubscribe();
    console.log('Destroying dashboard component');
  }
}
