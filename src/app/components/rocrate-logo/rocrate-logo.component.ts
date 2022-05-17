import { Component, Input, OnInit } from '@angular/core';
import { WorkflowVersion } from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

declare var $: any;

@Component({
  selector: 'rocrate-logo',
  templateUrl: './rocrate-logo.component.html',
  styleUrls: ['./rocrate-logo.component.scss'],
})
export class RocrateLogoComponent implements OnInit {
  @Input() workflow: WorkflowVersion;

  private _availableForDownload: boolean;

  // initialize logger
  private logger: Logger = LoggerManager.create('RocrateLogoComponent');

  constructor(private appService: AppService) {}

  ngOnInit(): void {
    this._availableForDownload = null;
    this.appService
      .checkROCrateAvailability(this.workflow)
      .subscribe((active: boolean) => {
        this._availableForDownload = active;
      });
  }

  public get availableForDownload(): boolean {
    return this._availableForDownload;
  }

  public downloadROCrate() {
    if (this.workflow) {
      this.logger.debug('Downloading RO-Crate of workflow ', this.workflow);
      this.appService.downloadROCrate(this.workflow);
    }
  }
}
