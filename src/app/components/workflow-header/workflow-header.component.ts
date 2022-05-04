import { Component, Input, OnInit } from '@angular/core';
import { Suite } from 'src/app/models/suite.models';
import { Workflow } from 'src/app/models/workflow.model';

@Component({
  selector: 'workflow-header',
  templateUrl: './workflow-header.component.html',
  styleUrls: ['./workflow-header.component.scss'],
})
export class WorkflowHeaderComponent implements OnInit {
  @Input() workflow: Workflow;
  @Input() suite: Suite;

  constructor() {}

  ngOnInit(): void {}
}
