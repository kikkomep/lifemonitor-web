import { ChangeDetectorRef, Component, HostListener, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription, timer } from 'rxjs';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem
} from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Workflow } from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
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
  // reference to the current subscriptions
  private workflowsStatsSubscription: Subscription;
  private userLoggedSubscription: Subscription;
  //
  private filteredWorkflows: AggregatedStatusStatsItem[] | null;
  //
  public statusFilter: string | null;
  public _workflowNameFilter: string = '';
  public workflowSortingOrder: string = 'desc';
  public editModeEnabled: boolean = false;

  private statsFilter = new StatsFilterPipe();

  // Reference to the dataTable instance
  private workflowDataTable: any;

  public updatingDataTable: boolean = false;

  // initialize logger
  private logger: Logger = LoggerManager.create('DashboardComponent');

  constructor(
    private cdref: ChangeDetectorRef,
    private appService: AppService,
    private router: Router,
    private inputDialog: InputDialogService,
    private uploaderService: WorkflowUploaderService
  ) { }

  ngOnInit() {
    this.logger.debug('Dashboard Created!!');
    this.userLoggedSubscription = this.appService.observableUserLogged
      .subscribe((isUserLogged) => {
        this.updatingDataTable = true;
        this._workflowStats.clear();
        this.filteredWorkflows = [];
        this.cdref.detectChanges();
        this.initDataTable();
      });
    this.workflowsStatsSubscription = this.appService.observableWorkflows.subscribe(
      (data) => {
        timer(1000).subscribe(x => {
          this.logger.debug("Loaded workflows: ", data);
          this._workflowStats = this.statsFilter.transform(
            data,
            this._workflowNameFilter
          );
          this.filteredWorkflows =
            this.searchModeEnabled || !this.isUserLogged()
              ? this._workflowStats.all
              : this._workflowStats.all.filter(
                (v) => v.subscriptions && v.subscriptions.length > 0);
          this.logger.debug('Stats', data);
          this.refreshDataTable();
        });
      }
    );
  }

  ngAfterViewInit() {
    this.logger.debug('Initializing workflow data!!');
    this._workflowStats = this.appService.workflowStats;
    this.updatingDataTable = true;
    if (this._workflowStats) {
      this.filteredWorkflows = this.searchModeEnabled || !this.isUserLogged()
        ? this._workflowStats.all
        : this._workflowStats.all.filter(
          (v) => v.subscriptions && v.subscriptions.length > 0);
      this.refreshDataTable();
    } else {
      this.appService.loadWorkflows(
        true,
        this.isUserLogged(),
        this.isUserLogged()
      ).subscribe(
        (data) => {
          this.logger.debug("Loaded workflows ", data);
        }
      );
    }
  }

  ngAfterViewChecked() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.logger.debug('Changes', changes);
  }

  public get workflowNameFilter(): string {
    return this._workflowNameFilter;
  }

  public set workflowNameFilter(value: string) {
    this._workflowNameFilter = value;
    this.editModeEnabled = false;
    this.updatingDataTable = true;
    this._workflowStats.clear();
    this.filteredWorkflows = [];
    this.cdref.detectChanges();
    if (value && value.length > 0)
      this.appService.loadWorkflows(
        false, false, this.isUserLogged()
      ).subscribe();
    else
      this.appService.loadWorkflows(
        false,
        this.isUserLogged(),
        this.isUserLogged()
      ).subscribe();
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
    this.logger.debug('Edit mode enabled: ' + this.editModeEnabled);
  }

  public get searchModeEnabled(): boolean {
    return this.workflowNameFilter && this.workflowNameFilter.length > 0;
  }

  public isEditable(w: Workflow) {
    return this.appService.isEditable(w);
  }

  public deleteWorkflowVersion(w: Workflow) {
    this.logger.debug("Deleting workflow version....", w);
    this.inputDialog.show({
      iconClass: 'fas fa-trash-alt',
      description:
        'Delete workflow <b>' +
        w.name + '</b> (version ' + w.version['version'] + ')?',
      onConfirm: () => {
        this.updatingDataTable = true;
        this.appService.deleteWorkflowVersion(w, w.version['version'])
          .subscribe((wd: { uuid: string; version: string }) => {
            this.logger.debug("Workflow deleted", wd);
            this.refreshDataTable(false);
          });
      },
    });
  }

  public subscribeWorkflow(w: Workflow) {
    this.logger.debug('Subscribing to workflow: ', w);
    this.appService.subscribeWorkflow(w).subscribe((w) => {
      this.logger.debug('Workflow subscription created!');
      this.refreshDataTable();
    });
  }

  public unsubscribeWorkflow(w: Workflow) {
    this.logger.debug('Unsubscribing from workflow: ', w);
    this.appService.unsubscribeWorkflow(w).subscribe((w) => {
      this.logger.debug('Workflow subscription deleted!');
      this.filteredWorkflows = this.searchModeEnabled
        ? this._workflowStats.all
        : this._workflowStats.all.filter(
          (v) => v.subscriptions && v.subscriptions.length > 0
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
    this.logger.debug('Test Build selected', testBuild);
    window.open(testBuild.externalLink, '_blank');
  }

  public get workflowStats(): AggregatedStatusStats {
    return this._workflowStats;
  }

  public get workflows(): AggregatedStatusStatsItem[] {
    return this.filteredWorkflows;
  }

  public filterWorkflows($event: any, workflows: AggregatedStatusStatsItem[]) {
    this.logger.debug($event);
    this.filteredWorkflows = workflows;
  }

  public filterByStatus(status: string) {
    this.logger.debug('Filter by status', status);
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
      this.logger.debug(e);
    }
  }

  private refreshDataTable(resetTableStatus: boolean = true) {
    if (resetTableStatus)
      this.updatingDataTable = true;
    try {
      this.destroyDataTable();
      this.cdref.detectChanges();
      this.initDataTable();
    } finally {
      if (resetTableStatus)
        this.updatingDataTable = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.refreshDataTable();
  }

  private initDataTable() {
    if (this.workflowDataTable) return;
    this.workflowDataTable = $("#workflowsDashboard").DataTable({
      "searchPlaceholder": "Filter",
      "paging": true,
      "lengthChange": true,
      "lengthMenu": [5, 10, 20, 50, 75, 100],
      "searching": true,
      "ordering": true,
      "order": [[1, 'asc']],
      "columnDefs": [{
        "targets": [0, 5, 6, 7],
        "orderable": false
      }],
      "info": true,
      "autoWidth": true,
      "responsive": true,
      "deferRender": true,
      stateSave: true,
      language: {
        search: "",
        searchPlaceholder: "Filter by UUID or name",
        "decimal": "",
        "emptyTable": "No workflow subscription found."
          + "Click to 'add' to register a new workflow "
          + "or use the main search box to subscribe to one among the existing workflows",
        "info": "Showing _START_ to _END_ of _TOTAL_ workflows",
        "infoEmpty": "Showing 0 to 0 of 0 workflows",
        "infoFiltered": "(filtered from a total of _MAX_ subscribed workflows)",
        "infoPostFix": "",
        "thousands": ",",
        "lengthMenu": "Show _MENU_ workflows",
        "loadingRecords": "Loading workflows...",
        "processing": "Processing workflows...",
        "zeroRecords": "No matching subscribed workflow found",
        "paginate": {
          "first": "First",
          "last": "Last",
          "next": "Next",
          "previous": "Previous"
        },
        "aria": {
          "sortAscending": ": activate to sort column ascending",
          "sortDescending": ": activate to sort column descending"
        }
      }
    });
  }

  private destroyDataTable() {
    if (this.workflowDataTable) {
      this.workflowDataTable.destroy();
      this.workflowDataTable = null;
    }
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    if (this.workflowsStatsSubscription)
      this.workflowsStatsSubscription.unsubscribe();
    this.logger.debug('Destroying dashboard component');
  }
}
