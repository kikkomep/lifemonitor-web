import { Component } from '@angular/core';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'LifeMonitor';

  ngAfterViewInit() {
    $(document).on('mouseover', '[data-toggle="tooltip"]', function () {
      $(this).tooltip('show');
    });
  }
}
