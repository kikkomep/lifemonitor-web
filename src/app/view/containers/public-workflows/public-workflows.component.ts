import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of, Subject } from 'rxjs';
import { Workflow } from 'src/app/core/models/workflow.model';
import * as WorkflowSelector from 'src/app/core/selectors/workflow.selector';
import { LifeMonitorApiService } from 'src/app/core/services/lifemonitor/lifemonitor-api.service';

@Component({
  selector: 'app-public-workflows',
  templateUrl: './public-workflows.component.html',
  styleUrls: ['./public-workflows.component.scss'],
})
export class PublicWorkflowsComponent implements OnInit {
  workflows$?: Observable<Workflow[]>;

  constructor(private store: Store /*, private service: LifeMonitorApiService*/) {
    this.workflows$ = this.store.select(WorkflowSelector.selectPublicWorkflows);
  }

  private subject: Subject<string> = new Subject<string>();

  sendMessage(message: string) {
    // this.service.getMessage(of(message)).subscribe((data) => {
    //   console.log('Message from worker: ', data);
    // });
  }

  ngOnInit(): void {}
}
