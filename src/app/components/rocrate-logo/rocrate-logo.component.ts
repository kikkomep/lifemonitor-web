import { AppService } from 'src/app/utils/services/app.service';
import { Component, Input, OnInit } from '@angular/core';
import { Workflow } from 'src/app/models/workflow.model';

@Component({
  selector: 'rocrate-logo',
  templateUrl: './rocrate-logo.component.html',
  styleUrls: ['./rocrate-logo.component.scss'],
})
export class RocrateLogoComponent implements OnInit {
  @Input() workflow: Workflow;

  constructor(private appService: AppService) {}

  ngOnInit(): void {}

  public downloadROCrate() {
    if (this.workflow) {
      console.log('Downloading RO-Crate of workflow ', this.workflow);
      this.appService.downloadROCrate(this.workflow);
    }
  }
}
