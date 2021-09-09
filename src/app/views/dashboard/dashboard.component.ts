import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AppService } from 'src/app/utils/services/app.service';
import { Subscription } from 'rxjs';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
} from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Suite } from 'src/app/models/suite.models';
import { Router } from '@angular/router';
import { Workflow } from 'src/app/models/workflow.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnChanges {
  // reference to workflows stats
  private _workflowStats: AggregatedStatusStats | null;
  // reference to the current subscription
  private workflowsStatsSubscription: Subscription;
  //
  private filteredWorkflows: AggregatedStatusStatsItem[] | null;
  //
  public statusFilter: string | null;
  public workflowNameFilter: string = '';
  public workflowSortingOrder: string = 'desc';

  constructor(private appService: AppService, private router: Router) {
    console.log('Dashboard Created!!');
    this.workflowsStatsSubscription = this.appService.observableWorkflows.subscribe(
      (data) => {
        this._workflowStats = data;
        this.filteredWorkflows = this._workflowStats.all;
        console.log('Stats', data);
      }
    );
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    console.log('Changes', changes);
  }

  public selectTestBuild(testBuild: TestBuild) {
    console.log('Test Build selected', testBuild);
    this.appService
      .selectWorkflow(testBuild.testInstance.suite.workflow.uuid)
      .subscribe((w: Workflow) => {
        this.appService
          .selectTestSuite(testBuild.suite_uuid)
          .subscribe((s: Suite) => {
            console.log('Selected suite from wf cmp: ', s);
            this.appService
              .selectTestInstance(testBuild.instance.uuid)
              .subscribe((ti) => {
                console.log('Selected test instance from wf component', ti);
                // this.router.navigate(['/build'], {
                //   queryParams: {
                //     instance_uuid: testBuild.instance.uuid,
                //     build_id: testBuild.build_id,
                //   },
                // });
                console.log(
                  'TestBuild external link: ',
                  testBuild.externalLink
                );
                window.open(testBuild.externalLink, '_blank');
              });
          });
      });
  }

  public get workflowStats(): AggregatedStatusStats {
    return this._workflowStats;
  }

  public get workflows(): AggregatedStatusStatsItem[] {
    return this.filteredWorkflows;
  }

  public filterWorkflows($event: any, workflows: AggregatedStatusStatsItem[]) {
    console.log($event);
    this.filteredWorkflows = workflows;
  }

  public filterByStatus(status: string) {
    console.log("Filter by status", status);
    if (!this._workflowStats) return;
    try {
      status = status == 'any' ? 'all' : status;
      if (status != this.statusFilter) {
        this.filteredWorkflows = this._workflowStats[status];
        this.statusFilter = status;
        this.workflowNameFilter = '';
      } else {
        this.filteredWorkflows = this._workflowStats['all'];
        this.statusFilter = null;
      }
    } catch (e) {
      console.log(e);
    }
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.workflowsStatsSubscription.unsubscribe();
    console.log('Destroying dashboard component');
  }
}
