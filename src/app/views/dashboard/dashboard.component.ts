import { ChangeDetectorRef, Component, ElementRef, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem
} from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Workflow } from 'src/app/models/workflow.model';
import { AppService } from 'src/app/utils/services/app.service';
import { InputDialogService } from 'src/app/utils/services/input-dialog.service';
import { WorkflowUploaderService } from 'src/app/utils/services/workflow-uploader.service';
import { StatsFilterPipe } from './../../utils/filters/stats-filter.pipe';

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
  public editModeEnabled: boolean = false;

  private statsFilter = new StatsFilterPipe();

  private workflowsDashboard: any;
  private dataTableInitialized: boolean = false;
  @ViewChild('workflowsDashboard') workflowsDashboardElement: ElementRef;

  constructor(
    private cdref: ChangeDetectorRef,
    private appService: AppService,
    private router: Router,
    private inputDialog: InputDialogService,
    private uploaderService: WorkflowUploaderService
  ) {
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

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  ngAfterViewChecked() {
    if (!this.dataTableInitialized) {
      this.workflowsDashboard = $(this.workflowsDashboardElement.nativeElement);
      this.workflowsDashboard.dataTable({
        "paging": true,
        "lengthChange": true,
        "lengthMenu": [5, 10, 20, 50, 75, 100],
        "searching": false,
        "ordering": true,
        "info": true,
        "autoWidth": false,
        "responsive": true,
      });
      this.dataTableInitialized = true;
    }
    this.cdref.detectChanges();
  }

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

  public openWorkflowUploader() {
    this.uploaderService.show({});
  }

  public editModeToggle() {
    this.editModeEnabled = !this.editModeEnabled;
    console.log('Edit mode enabled: ' + this.editModeEnabled);
  }

  public get searchModeEnabled(): boolean {
    return this.workflowNameFilter && this.workflowNameFilter.length > 0;
  }

  public isEditable(w: Workflow) {
    return this.appService.isEditable(w);
  }

  public deleteWorkflowVersion(w: Workflow) {
    console.log("Deleting workflow version....", w);
    this.inputDialog.show({
      iconClass: 'fas fa-trash-alt',
      description:
        'Delete workflow <b>' +
        w.name + '</b> (version ' + w.version['version'] + ')?',
      onConfirm: () => {
        this.appService.deleteWorkflowVersion(w, w.version['version'])
          .subscribe((wd: { uuid: string; version: string }) => {
            console.log("Workflow deleted", wd);
          });
      },
    });
  }

  public subscribeWorkflow(w: Workflow) {
    console.log('Subscribing to workflow: ', w);
    this.appService.subscribeWorkflow(w).subscribe((w) => {
      console.log('Workflow subscription created!');
    });
  }

  public unsubscribeWorkflow(w: Workflow) {
    console.log('Unsubscribing from workflow: ', w);
    this.appService.unsubscribeWorkflow(w).subscribe((w) => {
      console.log('Workflow subscription deleted!');
      this.appService.loadWorkflows(
        !this.isUserLogged(),
        this.isUserLogged(),
        this.isUserLogged()
      );
    });
  }

  public getWorkflowVisibilityTitle(w: Workflow) {
    return (
      "<span class='text-xs'><i class='fas fa-question-circle mx-1'></i>" +
      (w.public ? 'public' : 'private') +
      ' workflow</span>'
    );
  }

  public changeVisibility(w: Workflow) {
    this.inputDialog.show({
      iconClass: !w.public
        ? 'fas fa-lg fa-globe-americas'
        : 'fas fa-lg fa-user-lock',
      description:
        'Change visibility to <b>' +
        (!w.public ? 'public' : 'private') +
        '</b>?',
      onConfirm: () => {
        this.appService.changeWorkflowVisibility(w).subscribe(() => {
          $('.workflow-visibility-' + w.uuid)
            .tooltip('hide')
            .attr('data-original-title', this.getWorkflowVisibilityTitle(w))
            .tooltip('show');
        });
      },
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
