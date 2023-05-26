import { Component, OnDestroy, OnInit } from '@angular/core';
import { SwUpdate, UpdateAvailableEvent } from '@angular/service-worker';

import { Observable, Subscription } from 'rxjs';
import { Logger, LoggerManager } from './utils/logging/index';
import { CacheRefreshStatus } from './utils/services/cache/cache.model';
import { CachedHttpClientService } from './utils/services/cache/cachedhttpclient.service';
import { InputDialogService } from './utils/services/input-dialog.service';

import {
  NgcCookieConsentService,
  NgcInitializingEvent,
  NgcNoCookieLawEvent,
  NgcStatusChangeEvent,
} from 'ngx-cookieconsent';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'LifeMonitor';
  webWorker: Worker;
  refreshStatus$: Observable<CacheRefreshStatus>;

  private logger: Logger = LoggerManager.create('AppComponent');

  private checkVersionSubscription: Subscription;

  //keep refs to subscriptions to be able to unsubscribe later
  private popupOpenSubscription: Subscription;
  private popupCloseSubscription: Subscription;
  private initializeSubscription: Subscription;
  private statusChangeSubscription: Subscription;
  private revokeChoiceSubscription: Subscription;
  private noCookieLawSubscription: Subscription;

  constructor(
    private inputDialog: InputDialogService,
    private swUpdate: SwUpdate,
    private cachedHttpClient: CachedHttpClientService,
    private ccService: NgcCookieConsentService
  ) {
    this.refreshStatus$ = this.cachedHttpClient.refreshProgressStatus$;
  }

  get updateAvailable(): Observable<UpdateAvailableEvent> {
    return this.swUpdate.available;
  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.checkVersionSubscription = this.updateAvailable.subscribe(() => {
        this.inputDialog.show({
          iconImage: '/assets/img/logo/lm/LifeMonitorLogo.png',
          iconImageSize: '250',
          question: "<span class='text-primary'>new version available</span>",
          description: '... restarting ...',
          enableCancel: false,
          onConfirm: null,
          enableClose: false,
        });

        this.cachedHttpClient.clear().then(() => {
          setTimeout(() => {
            window.location.reload();
          }, 4000);
        });
      });
    }

    // subscribe to cookieconsent observables to react to main events
    this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(() => {});

    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(
      () => {}
    );

    this.initializeSubscription = this.ccService.initializing$.subscribe(
      (event: NgcInitializingEvent) => {}
    );

    this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
      (event: NgcStatusChangeEvent) => {}
    );

    this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(
      () => {}
    );

    this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe(
      (event: NgcNoCookieLawEvent) => {}
    );
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.checkVersionSubscription) {
      this.checkVersionSubscription.unsubscribe();
    }
    if (this.popupOpenSubscription) {
      this.popupOpenSubscription.unsubscribe();
    }
    if (this.popupCloseSubscription) {
      this.popupCloseSubscription.unsubscribe();
    }
    if (this.initializeSubscription) {
      this.initializeSubscription.unsubscribe();
    }
    if (this.statusChangeSubscription) {
      this.statusChangeSubscription.unsubscribe();
    }
    if (this.revokeChoiceSubscription) {
      this.revokeChoiceSubscription.unsubscribe();
    }
    if (this.noCookieLawSubscription) {
      this.noCookieLawSubscription.unsubscribe();
    }
  }
}
