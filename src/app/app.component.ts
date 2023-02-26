import { Component, OnInit } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { CachedHttpClientService } from './utils/services/cache/cachedhttpclient.service';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'LifeMonitor';
  webWorker: Worker;

  constructor(
    private swUpdate: SwUpdate,
    private client: CachedHttpClientService
  ) { }

  ngOnInit() {

    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe(() => {
        if (confirm("New version available. Load New Version?")) {
          window.location.reload();
        }
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
}
