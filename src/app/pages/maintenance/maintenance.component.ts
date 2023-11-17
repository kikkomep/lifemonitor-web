import { Component, OnInit } from '@angular/core';
import { AppConfigService } from 'src/app/utils/services/config.service';

@Component({
  selector: 'app-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {

  constructor(private appConfig: AppConfigService) { }

  ngOnInit(): void {
  }

  public get maintenanceMessage(): string {
    return this.appConfig.maintenanceMessage;
  }

}
