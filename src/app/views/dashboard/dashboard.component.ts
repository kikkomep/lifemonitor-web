import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
} from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Workflow } from 'src/app/models/workflow.model';
import { AppService } from 'src/app/utils/services/app.service';

declare var $: any;

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
    console.debug('Initializing workflow data!!');
    this._workflowStats = this.appService.workflowStats;
    if (this._workflowStats) this.filteredWorkflows = this._workflowStats.all;
    else this.appService.loadWorkflows();
  }

  ngOnInit() {}

  ngAfterViewInit() {}

  ngOnChanges(changes: SimpleChanges) {
    console.log('Changes', changes);
  }

  public isEditable(w: Workflow) {
    return this.appService.isEditable(w);
  }

  public changeVisibility(w: Workflow) {
    this.appService.changeWorkflowVisibility(w);
  }

  public selectTestBuild(testBuild: TestBuild) {
    console.log('Test Build selected', testBuild);
    window.open(testBuild.externalLink, '_blank');
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
    console.log('Filter by status', status);
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
