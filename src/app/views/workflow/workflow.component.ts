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

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
})
export class WorkflowComponent implements OnInit, OnChanges {
  // current workflow
  public workflow: Workflow;
  // suites of the current workflow
  public suites: AggregatedStatusStatsItem[] = [];

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
    console.log('Created component Workfoow');
    this.paramSubscription = this.route.params.subscribe((params) => {
      console.log('Params:', params);

      // subscribe for the current selected workflow
      this.workflowSubscription = this.appService.observableWorkflow.subscribe(
        (w: Workflow) => {
          console.log('Changed workflow', w, w.suites);
          if (w) {
            this.workflow = w;
            this.suites = this.workflow.suites.all;
            // this.workflowChangesSubscription = w.suites
            //   .asObservable()
            //   .subscribe((p) => {
            //     this.cdr.detectChanges();
            //     console.log('Handle change', p);
            //   });
          }
        }
      );

      // select a workflow
      this.appService.selectWorkflow(params['uuid']);

      // this.apiService
      //   .get_workflow(params['uuid'], true, true)
      //   .subscribe((data: Workflow) => {
      //     console.log('Workflow data: ', data.statusIcon);
      //     this.workflow = data as Workflow;
      //     console.log('Workflow data: ', this.workflow.statusIcon);
      //     this.apiService.get_suites(params['uuid']).subscribe((data) => {
      //       console.log('Suites', data);
      //     });
      //   });
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
    this.appService
      .selectTestSuite(testBuild.suite_uuid)
      .subscribe((s: Suite) => {
        console.log('Selected suite from wf cmp: ', s);
        this.appService
          .selectTestInstance(testBuild.instance.uuid)
          .subscribe((ti) => {
            console.log('Selected test instance from wf component', ti);
            this.router.navigate(['/build'], {
              queryParams: {
                instance_uuid: testBuild.instance.uuid,
                build_id: testBuild.build_id,
              },
            });
          });
      });
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.paramSubscription.unsubscribe();
    this.workflowSubscription.unsubscribe();
    // this.workflowChangesSubscription.unsubscribe();
  }
}
