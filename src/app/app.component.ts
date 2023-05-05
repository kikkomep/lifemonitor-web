import { Component, OnDestroy, OnInit } from '@angular/core';
import { SwUpdate, UpdateAvailableEvent } from '@angular/service-worker';

import { Observable, Subscription } from 'rxjs';
import { Logger, LoggerManager } from './utils/logging/index';
import { CacheRefreshStatus } from './utils/services/cache/cache.model';
import { CachedHttpClientService } from './utils/services/cache/cachedhttpclient.service';
import { InputDialogService } from './utils/services/input-dialog.service';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'LifeMonitor';
  webWorker: Worker;
  private logger: Logger = LoggerManager.create('AppComponent');

  refreshStatus$: Observable<CacheRefreshStatus>;

  checkVersionSubscription: Subscription;

  constructor(
    private inputDialog: InputDialogService,
    private swUpdate: SwUpdate,
    private cachedHttpClient: CachedHttpClientService
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
  }

  ngAfterViewInit() {
    // $(document)
    //   .on('mouseover', '[data-toggle="tooltip"]', function () {
    //     $(this).tooltip('show');
    //   })
    //   .on('mouseout', '[data-toggle="tooltip"]', function () {
    //     $(this).tooltip('hide');
    //   })
    //   .on('keyup', '[data-toggle="tooltip"]', function () {
    //     $(this).tooltip('hide');
    //   })
    //   .on('click', '[data-toggle="tooltip"]', function () {
    //     $(this).tooltip('hide');
    //   });
  }

  ngOnDestroy() {
    if (this.checkVersionSubscription) {
      this.checkVersionSubscription.unsubscribe();
    }
  }
}
