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
  public _workflowNameFilter: string = '';
  public workflowSortingOrder: string = 'desc';

  private statsFilter = new StatsFilterPipe();

  constructor(private appService: AppService, private router: Router) {
    console.log('Dashboard Created!!');
    this.workflowsStatsSubscription = this.appService.observableWorkflows.subscribe(
      (data) => {
        this._workflowStats = this.statsFilter.transform(
          data,
          this._workflowNameFilter
        );
        this.filteredWorkflows = this._workflowStats.all;
        console.log('Stats', data);
      }
    );
    console.debug('Initializing workflow data!!');
    this._workflowStats = this.appService.workflowStats;
    if (this._workflowStats) this.filteredWorkflows = this._workflowStats.all;
    else
      this.appService.loadWorkflows(
        true,
        this.isUserLogged(),
        this.isUserLogged()
      );
  }

  ngOnInit() {}

  ngAfterViewInit() {}

  ngOnChanges(changes: SimpleChanges) {
    console.log('Changes', changes);
  }

  public get workflowNameFilter(): string {
    return this._workflowNameFilter;
  }

  public set workflowNameFilter(value: string) {
    this._workflowNameFilter = value;
    this.editModeEnabled = false;
    if (value && value.length > 0)
      this.appService.loadWorkflows(false, false, false);
    else
      this.appService.loadWorkflows(
        false,
        this.isUserLogged(),
        this.isUserLogged()
      );
  }

  public get isLoading(): Observable<boolean> {
    return this.appService.isLoadingWorkflowsAsObservable;
  }

  public isUserLogged(): boolean {
    return this.appService.isUserLogged();
  }


  public get searchModeEnabled(): boolean {
    return this.workflowNameFilter && this.workflowNameFilter.length > 0;
  }

  public isEditable(w: Workflow) {
    return this.appService.isEditable(w);
  }

  public getWorkflowVisibilityTitle(w: Workflow) {
    return (
      "<span class='text-xs'><i class='fas fa-question-circle mx-1'></i>" +
      (w.public ? 'public' : 'private') +
      ' workflow</span>'
    );
  }

  public changeVisibility(w: Workflow) {
    this.appService.changeWorkflowVisibility(w).subscribe(() => {
      $('.workflow-visibility-' + w.uuid)
        .tooltip('hide')
        .attr('data-original-title', this.getWorkflowVisibilityTitle(w))
        .tooltip('show');
    });
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
