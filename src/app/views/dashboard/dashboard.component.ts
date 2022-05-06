import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, timer } from 'rxjs';
import { MouseClickHandler } from 'src/app/models/common.models';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem
} from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { WorkflowVersion, WorkflowVersionDetails } from 'src/app/models/workflow.model';
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
export class DashboardComponent implements OnInit {
  // reference to workflows stats
  private _workflowStats: AggregatedStatusStats | null;
  // reference to the current subscriptions
  private workflowsStatsSubscription: Subscription;
  private userLoggedSubscription: Subscription;
  private paramSubscription: Subscription;
  //
  private filteredWorkflows: AggregatedStatusStatsItem[] | null;
  //
  public statusFilter: string | null;
  public _workflowNameFilter: string = '';
  public workflowSortingOrder: string = 'desc';
  public editModeEnabled: boolean = false;
  private _searchModeEnabled: boolean = false;
  private openUploader: boolean = false;

  private statsFilter = new StatsFilterPipe();

  // Reference to the dataTable instance
  private workflowDataTable: any = null;

  public updatingDataTable: boolean = false;

  private clickHandler: MouseClickHandler = new MouseClickHandler();

  // initialize logger
  private logger: Logger = LoggerManager.create('DashboardComponent');

  constructor(
    private location: Location,
    private cdref: ChangeDetectorRef,
    private appService: AppService,
    private toastService: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
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
        this.workflowDataTable.clear();
        this.workflowDataTable.draw();
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

    this.paramSubscription = this.route.params.subscribe((params) => {
      this.logger.debug('Dashboard params:', params);
      if (params['add'] == "true") {
        this.openUploader = true;
        this.location.replaceState('/dashboard');
      }
    });
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
          if (this.openUploader === true)
            this.openWorkflowUploader();
        }
      );
    }
  }

  ngAfterViewChecked() {
  }


  public get workflowNameFilter(): string {
    return this._workflowNameFilter;
  }

  public set workflowNameFilter(value: string) {
    this._workflowNameFilter = value ? value.replace("SEARCH_KEY###", "") : "";
    this.editModeEnabled = false;
    this._searchModeEnabled = true;
    this.updatingDataTable = true;
    this._workflowStats.clear();
    this.filteredWorkflows = [];
    this.cdref.detectChanges();
    this.logger.debug("Updating workflow name filter", this.workflowNameFilter);
    if (value && value.length > 0) {
      this.workflowDataTable.clear();
      this.appService.loadWorkflows(
        false, false, this.isUserLogged()
      ).subscribe();
    } else {
      if (!value) this._searchModeEnabled = false;
      this.workflowDataTable.clear();
      this.appService.loadWorkflows(
        false,
        this.isUserLogged(),
        this.isUserLogged()
      ).subscribe();
    }
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
    // return this.workflowNameFilter && this.workflowNameFilter.length > 0;
    return this._searchModeEnabled;
  }

  public isEditable(w: WorkflowVersion) {
    return this.appService.isEditable(w);
  }

  public deleteWorkflowVersion(w: WorkflowVersion) {
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

  public subscribeWorkflow(w: WorkflowVersion) {
    this.logger.debug('Subscribing to workflow: ', w);
    this.appService.subscribeWorkflow(w).subscribe((w) => {
      this.logger.debug('Workflow subscription created!');
    });
  }

  public unsubscribeWorkflow(w: WorkflowVersion) {
    this.logger.debug('Unsubscribing from workflow: ', w);
    this.appService.unsubscribeWorkflow(w).subscribe((w) => {
      this.logger.debug('Workflow subscription deleted!');
      this.filteredWorkflows = this.searchModeEnabled
        ? this._workflowStats.all
        : this._workflowStats.all.filter(
          (v) => v.subscriptions && v.subscriptions.length > 0
        );
      if (!this.searchModeEnabled)
        this.refreshDataTable();
    });
  }

  public getWorkflowVisibilityTitle(w: WorkflowVersion) {
    return (
      "<span class='text-xs'><i class='fas fa-question-circle mx-1'></i>" +
      (w.public ? 'public' : 'private') +
      ' workflow</span>'
    );
  }

  public restoreWorkflowName(w: WorkflowVersion) {
    w.name = w['oldNameValue'];
    w['editingMode'] = false;
  }

  public showWorkflowDetails(w: WorkflowVersion) {
    this.clickHandler.click(() => {
      this.router.navigate([
        '/workflow', { uuid: w.asUrlParam(), version: w.version["version"] }]);
    });
  }

  public enableWorkflowEditMode(w: WorkflowVersion) {
    this.clickHandler.doubleClick(() => {
      if (this.isUserLogged() && this.isEditable(w)) {
        w['oldNameValue'] = w.name;
        w['clickOnInputBox'] = false;
        w['editingMode'] = true;
      }
    });
  }

  public updateWorkflowName(w: WorkflowVersion) {
    this.logger.debug("Updating workflow name", w);
    this.appService.updateWorkflowName(w).subscribe(() => {
      this.toastService.success("Workflow updated!", '', { timeOut: 2500 });
      w['editingMode'] = false;
    },
      (error) => {
        this.toastService.error("Unable to update workflow", '', { timeOut: 2500 });
        this.logger.error(error);
      }
    );
  }

  public changeVisibility(w: WorkflowVersion) {
    this.inputDialog.show({
      iconClass: !w.public
        ? 'fas fa-lg fa-globe-americas'
        : 'fas fa-lg fa-user-lock',
      description:
        'Change visibility to <b>' +
        (!w.public ? 'public' : 'private') +
        '</b>?',
      confirmText: "Confirm",
      onConfirm: () => {
        this.appService.changeWorkflowVisibility(w).subscribe(() => {
          $('.workflow-visibility-' + w.uuid)
            .tooltip('hide')
            .attr('data-original-title', this.getWorkflowVisibilityTitle(w))
            .tooltip('show');
          this.toastService.success("Workflow visibility updated!", '', { timeOut: 2500 });
        },
          (error) => {
            this.toastService.error("Unable to change workflow visibility", '', { timeOut: 2500 });
            this.logger.error(error);
          }
        );
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

  public getStatsLength(workflows: AggregatedStatusStatsItem[]): number {
    let items = workflows;
    if (this.isUserLogged())
      items = workflows.filter((v) => v.subscriptions && v.subscriptions.length > 0);
    return items.length;
  }

  public get workflows(): AggregatedStatusStatsItem[] {
    return this.filteredWorkflows;
  }

  public filterWorkflows($event: any, workflows: AggregatedStatusStatsItem[]) {
    this.logger.debug($event);
    this.filteredWorkflows = workflows;
  }


  public selectWorkflowVersion(version: any){
    this.logger.debug("Selected workflow version:", version);
  }

  public filterByStatus(status: string) {
    this.logger.debug('Filter by status', status);
    if (!this._workflowStats) return;
    try {
      status = status == 'any' ? 'all' : status;
      if (status != this.statusFilter) {
        this.filteredWorkflows =
          (!this.isUserLogged() || this.searchModeEnabled) ? this._workflowStats[status]
            : this._workflowStats[status].filter(
              (v: { subscriptions: string | any[]; }) => v.subscriptions && v.subscriptions.length > 0);
        this.statusFilter = status;
        this.refreshDataTable();
      } else {
        this.filteredWorkflows =
          (!this.isUserLogged() || this.searchModeEnabled) ? this._workflowStats['all']
            : this._workflowStats['all'].filter(
              (v: { subscriptions: string | any[]; }) => v.subscriptions && v.subscriptions.length > 0);
        this.statusFilter = null;
        this.refreshDataTable();
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
      this.cdref.detectChanges();
      $('.selectpicker').selectpicker();
      // $('#registryWorkflowSelector').selectpicker('refresh');
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
      "autoWidth": false,
      "responsive": true,
      // "deferRender": true,
      // "scrollY": "520",
      "stateSave": true,
      "language": {
        search: "",
        searchPlaceholder: "Filter by UUID or name",
        "decimal": "",
        "emptyTable":
          // this.updatingDataTable ? "" :
          this.workflowNameFilter && this.workflowNameFilter.length > 0
            ? "No matching workflows"
            : "<h4 class='mt-3'>No workflow found</h4>."
            + (this.isUserLogged() ? "<div class=\"m-2\"> Click on "
              + "<a class='add-wf' href=\"/dashboard;add=true\"><i class=\"fas fa-plus-circle\"></i> "
              + "to add a new workflow</a> "
              + "<br>or use the main search box <br>to find and subscribe to existing workflows</div>" : ""),
        "info": "Showing _START_ to _END_ of _TOTAL_ workflows",
        "infoEmpty": "Showing 0 to 0 of 0 workflows",
        "infoFiltered": "(filtered from a total of _MAX_"
          + (this.isUserLogged() ? " subscribed" : "") + " workflows)",
        "infoPostFix": "",
        "thousands": ",",
        "lengthMenu": "Show _MENU_ workflows",
        "loadingRecords": "Loading workflows...",
        "processing": "Processing workflows...",
        "zeroRecords": "No matching "
          + (this.isUserLogged() ? "subscribed" : "") + " workflow found",
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
    if (this.paramSubscription)
      this.paramSubscription.unsubscribe();
    this.logger.debug('Destroying dashboard component');
  }
}
