import { Observable } from 'rxjs';
import { AppService } from 'src/app/utils/services/app.service';
import { Component, Input, OnInit } from '@angular/core';
import { Workflow } from 'src/app/models/workflow.model';

declare var $: any;

@Component({
  selector: 'rocrate-logo',
  templateUrl: './rocrate-logo.component.html',
  styleUrls: ['./rocrate-logo.component.scss'],
})
export class RocrateLogoComponent implements OnInit {
  @Input() workflow: Workflow;

  private _availableForDownload: boolean;

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
      console.log('Downloading RO-Crate of workflow ', this.workflow);
      this.appService.downloadROCrate(this.workflow);
    }
  }
}
