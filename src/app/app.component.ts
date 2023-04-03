import { Component, OnDestroy, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

import { Logger, LoggerManager } from './utils/logging/index';
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

  constructor(
    private inputDialog: InputDialogService,
    private swUpdate: SwUpdate
  ) {}

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(() => {
        this.inputDialog.show({
          iconImage: '/assets/img/logo/lm/LifeMonitorLogo.png',
          iconImageSize: '250',
          question: "<span class='text-primary'>new version available</span>",
          description: '... restarting ...',
          enableCancel: false,
          onConfirm: null,
          enableClose: false,
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      });
    }
  }

  ngAfterViewInit() {
    $(document)
      .on('mouseover', '[data-toggle="tooltip"]', function () {
        $(this).tooltip('show');
      })
      .on('mouseout', '[data-toggle="tooltip"]', function () {
        $(this).tooltip('hide');
      })
      .on('keyup', '[data-toggle="tooltip"]', function () {
        $(this).tooltip('hide');
      })
      .on('click', '[data-toggle="tooltip"]', function () {
        $(this).tooltip('hide');
      });
  }

  ngOnDestroy() {}
}
