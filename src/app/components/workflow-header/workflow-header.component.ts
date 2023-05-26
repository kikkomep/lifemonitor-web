import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Suite } from 'src/app/models/suite.models';
import { WorkflowVersion } from 'src/app/models/workflow.model';
import { AppService } from 'src/app/utils/services/app.service';
import { AppConfigService } from 'src/app/utils/services/config.service';

@Component({
  selector: 'workflow-header',
  templateUrl: './workflow-header.component.html',
  styleUrls: ['./workflow-header.component.scss'],
})
export class WorkflowHeaderComponent implements OnInit {
  @Input() workflow: WorkflowVersion;
  @Input() suite: Suite;

  constructor(
    private appConfig: AppConfigService,
    private appService: AppService
  ) {}

  ngOnInit(): void {}

  public get roCrateDownloadUrl(): string {
    return this.workflow.getDownloadLink(this.appConfig.apiBaseUrl);
  }

  public checkDownloadAvailability(): Observable<boolean> {
    return this.appService.checkROCrateAvailability(this.workflow);
  }

  public downloadROCrate() {
    if (this.workflow) {
      this.appService.downloadROCrate(this.workflow);
    }
    return false;
  }

  public get firstRegistry(): any {
    return this.workflow &&
      this.workflow.registries &&
      this.workflow.registries.length > 0
      ? this.workflow.registries[0]
      : null;
  }
}
