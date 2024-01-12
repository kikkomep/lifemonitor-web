/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { SwUpdate, UpdateAvailableEvent } from '@angular/service-worker';

import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Logger, LoggerManager } from './utils/logging/index';
import { CacheRefreshStatus } from './utils/services/cache/cache.model';
import { CachedHttpClientService } from './utils/services/cache/cachedhttpclient.service';
import { AppConfigService } from './utils/services/config.service';
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
    private ccService: NgcCookieConsentService,
    private config: AppConfigService,
    private router: Router
  ) {
    this.refreshStatus$ = this.cachedHttpClient.refreshProgressStatus$;
  }

  get updateAvailable(): Observable<UpdateAvailableEvent> {
    return this.swUpdate.available;
  }

  get maintenanceModeEnabled(): boolean {
    return this.config.maintenanceMode;
  }

  ngOnInit() {

    if (this.maintenanceModeEnabled) {
      console.log("Current route: " + this.router.url);
      if (this.router.url !== '/maintenance'
        && !this.router.url.startsWith('/static')) {
        return this.router.navigateByUrl('/maintenance');
      }
    }

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
    this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(() => { });

    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(
      () => { }
    );

    this.initializeSubscription = this.ccService.initializing$.subscribe(
      (event: NgcInitializingEvent) => { }
    );

    this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
      (event: NgcStatusChangeEvent) => { }
    );

    this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(
      () => { }
    );

    this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe(
      (event: NgcNoCookieLawEvent) => { }
    );
  }

  ngAfterViewInit() { }

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
