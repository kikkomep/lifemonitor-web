import { Component, OnInit } from '@angular/core';
import { AppConfigService } from 'src/app/utils/services/config.service';
import packageInfo from '../../../../../package.json';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  public appVersion = packageInfo.version;
  public backendBaseUrl: string = null;
  constructor(private appConfig: AppConfigService) {
    this.backendBaseUrl = this.appConfig.getConfig()['apiBaseUrl'];
  }

  ngOnInit() { }
}
