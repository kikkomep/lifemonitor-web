import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Color, Label, SingleDataSet } from 'ng2-charts';
import {
  ChangeDetectorRef,
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
  StatusStatsItem,
} from 'src/app/models/stats.model';

import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/utils/services/api.service';
import { AppService } from 'src/app/utils/services/app.service';
import { Subscription } from 'rxjs';
import { Workflow } from 'src/app/models/workflow.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Suite } from 'src/app/models/suite.models';
import { Model, Property } from 'src/app/models/base.models';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
})
export class WorkflowComponent implements OnInit, OnChanges {
  // current workflow
  public workflow: Workflow;
  // suites of the current workflow
  public suites: AggregatedStatusStatsItem[] = null;

  private paramSubscription: Subscription;
  private workflowSubscription: Subscription;
  private workflowChangesSubscription: Subscription;

  public selectedTestBuild: StatusStatsItem;

  public statusFilter: string | null;
  public suiteNameFilter: string = '';
  public suiteSortingOrder: string = 'desc';

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    // private apiService: ApiService,
    private appService: AppService
  ) {}

  ngOnInit() {
    console.log('Created component Workflow');

    // subscribe for the current selected workflow
    this.workflowSubscription = this.appService.observableWorkflow.subscribe(
      (w: Workflow) => {
        console.log('Changed workflow', w, w.suites);
        this.workflow = w;
        this.workflowChangesSubscription = this.workflow
          .asObservable()
          .subscribe((change) => {
            this.suites = this.workflow.suites.all;
            this.cdr.detectChanges();
            console.log('Handle change', change);
          });
        if (this.workflow.suites) this.suites = this.workflow.suites.all;
      }
    );

    this.paramSubscription = this.route.params.subscribe((params) => {
      // select a workflow
      this.appService.selectWorkflow(params['uuid']);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Change detected');
    this.cdr.detectChanges();
  }

  public filterByStatus(status: string) {
    if (!this.workflow) return;
    try {
      status = status == 'any' ? 'all' : status;
      if (status != this.statusFilter) {
        this.suites = this.workflow.suites[status];
        this.statusFilter = status;
        this.suiteNameFilter = '';
      } else {
        this.suites = this.workflow.suites['all'];
        this.statusFilter = null;
      }
    } catch (e) {
      console.log(e);
    }
  }

  public selectTestBuild(testBuild: TestBuild) {
    console.log('Test Build selected', testBuild);
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.paramSubscription.unsubscribe();
    this.workflowSubscription.unsubscribe();
    if (this.workflowChangesSubscription)
      this.workflowChangesSubscription.unsubscribe();
  }
}
