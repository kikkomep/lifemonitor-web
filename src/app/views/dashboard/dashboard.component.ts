import { Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  NgZone,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MouseClickHandler } from 'src/app/models/common.models';
import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
  AggregatedTestStatusMap,
} from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { User } from 'src/app/models/user.modes';
import { Workflow, WorkflowVersion } from 'src/app/models/workflow.model';
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
export class DashboardComponent implements OnInit, OnChanges, AfterViewInit {
  private _workflows: Workflow[] = null;
  // reference to workflows stats
  private _workflowStats: AggregatedStatusStats | null;
  // reference to the current subscriptions
  private workflowsStatsSubscription: Subscription;
  private workflowUpdateSubscription: Subscription;
  private workflowLoadingSubscription: Subscription;
  private workflowsLoadingSubscription: Subscription;
  private userLoggedSubscription: Subscription;
  private internalParamsSubscription: Subscription;
  private queryParamsSubscription: Subscription;
  private internalParamSubscription: Subscription;
  //
  private filteredWorkflows: AggregatedStatusStatsItem[] | null;

  //
  public statusFilter: string | null;
  public _workflowNameFilter: string = '';
  public workflowSortingOrder: string = 'desc';
  public editModeEnabled: boolean = false;
  private _searchModeEnabled: boolean = false;
  private openUploader: boolean = false;
  _browseButtonEnabled: boolean = false;

  private statsFilter = new StatsFilterPipe();

  // Reference to the dataTable instance
  private workflowDataTable: any = null;

  public updatingDataTable: boolean = false;

  private loadingWorkflows: boolean = false;
  private loadingWorkflowVersions = [];
  private loadingWorkflowVersionMap: { [uuid: string]: boolean } = {};

  private clickHandler: MouseClickHandler = new MouseClickHandler();

  // Sort configuration
  sortField: string = 'modified';
  sortOrder: number = -1;
  sortKey: string;
  sortCriterion: { field: string; order: number };
  sortOptions = [
    {
      label: 'Name (asc)',
      value: { field: 'name', order: 1 },
      iconClass: 'fas fa-align-left',
      description: 'order by name (ascending order)',
    },
    {
      label: 'Name (desc)',
      value: { field: 'name', order: -1 },
      iconClass: 'fas fa-align-right',
      description: 'order by name (descending order)',
    },
    {
      label: 'Creation time (asc)',
      value: { field: 'created', order: 1 },
      iconClass: 'pi pi-clock',
      description: 'order by creation time (ascending order)',
    },
    {
      label: 'Creation time (desc)',
      value: { field: 'created', order: -1 },
      iconClass: 'pi pi-clock',
      description: 'order by creation time (descending order)',
    },
    {
      label: 'Modification time (asc)',
      value: { field: 'modified', order: 1 },
      iconClass: 'pi pi-stopwatch',
      description: 'order by modification time (ascending order)',
    },
    {
      label: 'Modification time (desc)',
      value: { field: 'modified', order: -1 },
      iconClass: 'pi pi-stopwatch',
      description: 'order by modification time (descending order)',
    },
  ];

  // initialize logger
  private logger: Logger = LoggerManager.create('DashboardComponent');

  @ViewChild('workflowsDataView')
  dataView: any;

  constructor(
    private location: Location,
    private cdref: ChangeDetectorRef,
    private appService: AppService,
    private toastService: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private inputDialog: InputDialogService,
    private uploaderService: WorkflowUploaderService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.logger.debug('Dashboard Created!!');
    // alert('Initializing Dashboard...');
    this.userLoggedSubscription = this.appService.observableUser.subscribe(
      (user: User) => {
        const isUserLogged = user !== null;
        if (!this.appService.isLoadingWorkflows()) {
          // alert('Notify user changed ' + isUserLogged);
          if (this._workflowStats) this._workflowStats.clear();
          this.updatingDataTable = true;
          this.appService
            .loadWorkflows(false, isUserLogged, isUserLogged)
            .subscribe((data) => {
              this.logger.debug('Loaded workflows ', data);
              // alert('Loading from user logged ' + user);
            });
        }
        // else alert('Skpping reload');
      }
    );
    this.workflowsStatsSubscription = this.appService.observableWorkflows.subscribe(
      (workflows: Workflow[]) => {
        this.logger.debug('Loaded subscriptions for workflows: ', workflows);
        this.prepareTableData(workflows);
      }
    );

    this.workflowUpdateSubscription = this.appService.observableWorkflowUpdate.subscribe(
      (wv: WorkflowVersion) => {
        // alert('Dashboard::observableLoadingWorkflow Updating... ' + wv.name);
        this.prepareTableData();
      }
    );

    this.workflowLoadingSubscription = this.appService.observableLoadingWorkflow.subscribe(
      (w) => {
        this.loadingWorkflowVersionMap[w.uuid] = w.loading;
      }
    );

    this.queryParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
        console.debug('Query params: ', params);
        if ('status' in params) {
          // Parse and normalize status filter
          let status: string = params['status'].toLowerCase();
          console.debug('Status: ', status);
          for (let s in AggregatedTestStatusMap) {
            if (s === status || AggregatedTestStatusMap[s].includes(status)) {
              this.statusFilter = s;
            }
          }
        }
      }
    );

    this.internalParamSubscription = this.route.params.subscribe((params) => {
      this.logger.debug('Dashboard params:', params);
      if (params['add'] == 'true') {
        this.openUploader = true;
        this.location.replaceState('/dashboard');
      }
    });
    this.logger.debug('Initializing workflow data!!');
    this._workflows = this.appService.workflows;
    this._workflowNameFilter = '';
    this.updatingDataTable = true;
    if (this._workflows) {
      this.prepareTableData();
    } else {
      this.appService.checkIsUserLogged().then((isUserLogged) => {
        this.updatingDataTable = true;
        if (this._workflowStats) this._workflowStats.clear();
        if (this.openUploader === true) this.openWorkflowUploader();
        if (!this.appService.isLoadingWorkflows())
          this.appService
            .loadWorkflows(false, isUserLogged, isUserLogged)
            .subscribe((data) => {
              this.logger.debug('Loaded workflows ', data);
              // alert('Loaded workflows from dashboard init');
            });
      });
    }
  }

  ngAfterViewChecked() {
    // alert("After view checked")
    // this.checkWindowSize();
  }

  isSmallScreen: boolean = false;
  ngAfterViewInit(): void {
    $('[data-toggle="tooltip"]', function () {
      $(this).tooltip('hide');
    });

    this.isSmallScreen = window.matchMedia('(max-width: 576px)').matches;

    const mediaQuery = window.matchMedia('(max-width: 576px)');
    mediaQuery.addEventListener('change', (e) => {
      this.isSmallScreen = e.matches;
      this.updateLayout();
    });

    this.updateLayout();
  }

  onSortChangeEvent(event: any) {
    return this.onSortChange(event.value);
  }

  onSortChange(criterion: { field: string; order: number }) {
    this.sortCriterion = criterion;
    this.sortField = criterion.field;
    this.sortOrder = criterion.order;
    this.logger.debug('Update sort criterion', criterion);
  }

  getCriterionDescription() {
    const criterion = this.sortOptions.find(
      (c) => c.value === this.sortCriterion
    );
    return criterion?.description;
  }

  private updateLayout(): void {
    if (this.dataView) {
      this.dataView.layout = this.isSmallScreen ? 'grid' : 'list';
      this.cdref.detectChanges();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    $('[data-toggle="tooltip"]', function () {
      $(this).tooltip('hide');
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    event.target.innerWidth;
    console.log('Resize', event.target.innerWidth);
    if (event.target.innerWidth < 1200) {
      this.dataView.layout = 'grid';
      this.cdref.detectChanges();
    }
  }

  private checkWindowSize() {
    if (this.dataView && window.innerWidth < 1200) {
      this.dataView.layout = 'grid';
    }
  }

  public get workflowNameFilter(): string {
    return this._workflowNameFilter;
  }

  public get browseButtonEnabled(): boolean {
    return this._browseButtonEnabled;
  }

  public set browseButtonEnabled(value: boolean) {
    this.setBrowseButtonEnabled(value);
  }

  public setBrowseButtonEnabled(value: boolean) {
    this._browseButtonEnabled = value;
    if (!this._browseButtonEnabled) this._workflowNameFilter = '';
    this._searchModeEnabled = this._browseButtonEnabled;
    this.prepareTableData();
  }

  public set workflowNameFilter(value: string) {
    this._workflowNameFilter = value ? value.replace('SEARCH_KEY###', '') : '';
    this.editModeEnabled = false;
    this.prepareTableData();
  }

  public get isLoading(): Observable<boolean> {
    return this.appService.isLoadingWorkflowsAsObservable;
  }

  public isUserLogged(): boolean {
    return this.appService.isUserLogged();
  }

  public openWorkflowUploader() {
    this.uploaderService.show({
      title: 'Register Workflow',
      iconClass: 'fas fa-cogs',
      iconClassSize: 'fa-7x',
      iconImage: null,
    });
  }

  public openWorkflowVersionUploader(workflow: Workflow) {
    this.uploaderService.show({
      iconImage: '/assets/icons/branch-add-eosc-green.png',
      title: 'Register new version of <br><b>"' + workflow.name + '"</b>',
      workflowUUID: workflow.uuid,
      workflowName: workflow.name,
    });
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

  public updateSelectedVersion(workflow_version: WorkflowVersion) {
    this.logger.debug('Updated workflow version', workflow_version);
    this.prepareTableData();
    this.logger.debug('The current datatable: ', this.workflowDataTable);
  }

  public isLoadingWorkflowVersion(workflow: Workflow) {
    // return workflow && this.loadingWorkflowVersions.indexOf(workflow.uuid) >= 0;
    return this.loadingWorkflowVersionMap[workflow.uuid] ?? false;
  }

  public loadingWorkflowVersion(workflow: Workflow) {
    if (workflow) {
      this.loadingWorkflowVersions.push(workflow.uuid);
    } else {
      let i = this.loadingWorkflowVersions.indexOf(workflow.uuid);
      if (i >= 0) {
        this.loadingWorkflowVersions.splice(i, 1);
      }
    }
  }

  public deleteWorkflowVersion(w: WorkflowVersion) {
    this.logger.debug('Deleting workflow version....', w);
    this.inputDialog.show({
      iconImage: '/assets/icons/branch-delete-eosc-green.png',
      iconImageSize: '160',
      description:
        'Delete version <b>"' +
        w.version['version'] +
        '"</b><br/> of workflow <b>' +
        w.name +
        '</b>?',
      onConfirm: () => {
        // this.updatingDataTable = true;
        this.appService
          .deleteWorkflowVersion(w)
          .subscribe((wd: { uuid: string; version: string }) => {
            this.logger.debug('Workflow deleted', wd);
            // this.refreshDataTable(false);
          });
      },
    });
  }

  public deleteWorkflow(w: Workflow) {
    this.logger.debug('Deleting workflow ....', w);
    this.inputDialog.show({
      iconClass: 'fas fa-trash-alt',
      description: 'Delete workflow <b>' + w.name + '</b>?',
      onConfirm: () => {
        this.updatingDataTable = true;
        this.appService
          .deleteWorkflow(w)
          .subscribe((wd: { uuid: string; version: string }) => {
            this.logger.debug('Workflow deleted', wd);
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
        '/workflow',
        { uuid: w.asUrlParam(), version: w.version['version'] },
      ]);
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
    this.logger.debug('Updating workflow name', w);
    this.appService.updateWorkflowName(w.workflow).subscribe(
      () => {
        this.toastService.success('Workflow updated!', '', { timeOut: 2500 });
        w['editingMode'] = false;
      },
      (error) => {
        this.toastService.error('Unable to update workflow', '', {
          timeOut: 2500,
        });
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
      confirmText: 'Confirm',
      onConfirm: () => {
        this.appService.changeWorkflowVisibility(w).subscribe(
          () => {
            $('.workflow-visibility-' + w.uuid)
              .tooltip('hide')
              .attr('data-original-title', this.getWorkflowVisibilityTitle(w))
              .tooltip('show');
            this.toastService.success('Workflow visibility updated!', '', {
              timeOut: 2500,
            });
          },
          (error) => {
            this.toastService.error(
              'Unable to change workflow visibility',
              '',
              { timeOut: 2500 }
            );
            this.logger.error(error);
          }
        );
      },
    });
  }

  public selectTestBuild(testBuild: TestBuild) {
    this.logger.debug('Test Build selected', testBuild);
    if (testBuild.externalLink)
      window.open(testBuild.externalLink as string, '_blank');
  }

  public get workflowStats(): AggregatedStatusStats {
    return this._workflowStats;
  }

  public getStatsLength(workflows: AggregatedStatusStatsItem[]): number {
    let items = workflows;
    if (
      this._workflowNameFilter &&
      this._workflowNameFilter !== '______ALL_____'
    ) {
      items = items.filter(
        (v) =>
          v.name
            .toLowerCase()
            .indexOf(this._workflowNameFilter.toLowerCase()) >= 0 ||
          v.uuid
            .toLowerCase()
            .indexOf(this._workflowNameFilter.toLowerCase()) >= 0
      );
    }
    if (this.isUserLogged() && !this.browseButtonEnabled)
      items = items.filter(
        (v) => v.subscriptions && v.subscriptions.length > 0
      );

    return items.length;
  }

  public get workflows(): AggregatedStatusStatsItem[] {
    return this.filteredWorkflows;
  }

  public filterWorkflows($event: any, workflows: AggregatedStatusStatsItem[]) {
    this.logger.debug($event);
    this.filteredWorkflows = workflows;
  }

  public selectWorkflowVersion(version: any) {
    this.logger.debug('Selected workflow version:', version);
  }

  public filterByStatus(status: string, asToggle: boolean = true) {
    this.logger.debug('Filter by status', status);
    if (!this._workflowStats) return;
    try {
      status = status == 'any' ? 'all' : status;
      if (status != this.statusFilter || !asToggle) {
        this.filteredWorkflows =
          !this.isUserLogged() || this.searchModeEnabled
            ? this._workflowStats[status]
            : this._workflowStats[status].filter(
                (v: { subscriptions: string | any[] }) =>
                  v.subscriptions && v.subscriptions.length > 0
              );
        this.statusFilter = status;
        // this.refreshDataTable();
      } else {
        this.filteredWorkflows =
          !this.isUserLogged() || this.searchModeEnabled
            ? this._workflowStats['all']
            : this._workflowStats['all'].filter(
                (v: { subscriptions: string | any[] }) =>
                  v.subscriptions && v.subscriptions.length > 0
              );
        this.statusFilter = null;
        // remove status params from query if defined
        const queryParams = { ...this.route.snapshot.queryParams };
        delete queryParams.status;
        this.router.navigate([], { queryParams: queryParams });
        // this.refreshDataTable();
      }
    } catch (e) {
      this.logger.debug(e);
    }
  }

  private prepareTableData(workflows: Workflow[] = null) {
    workflows = workflows || this._workflows;
    if (!workflows || typeof workflows === 'undefined') return;

    this.logger.debug('Loaded workflows: ', workflows);
    // Initialize workflow stats
    let stats = new AggregatedStatusStats();

    workflows.forEach((w: Workflow) => {
      if (w.currentVersion) {
        if (
          !this.appService.isUserLogged() ||
          this._browseButtonEnabled ||
          (w.currentVersion.subscriptions &&
            w.currentVersion.subscriptions.length > 0)
        )
          stats.add(w.currentVersion);
      }
    });
    this.logger.debug('Initialized Stats', stats);

    if (stats) {
      this._workflowStats = this.statsFilter.transform(
        stats,
        this._workflowNameFilter
      );

      if (this.statusFilter) {
        this.filterByStatus(this.statusFilter, false);
      } else {
        this.filteredWorkflows =
          // this.searchModeEnabled || !this.isUserLogged()
          this.browseButtonEnabled || !this.isUserLogged()
            ? stats.all
            : stats.all.filter(
                (v) => v.subscriptions && v.subscriptions.length > 0
              );
      }
    }

    this._workflowStats = stats;
    this._workflows = workflows;

    //
    this.updatingDataTable = false;

    this.checkWindowSize();

    this.cdref.detectChanges();
  }

  public get layout(): string {
    return this.dataView?.layout;
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    if (this.workflowsStatsSubscription)
      this.workflowsStatsSubscription.unsubscribe();
    if (this.internalParamsSubscription)
      this.internalParamsSubscription.unsubscribe();
    if (this.queryParamsSubscription)
      this.queryParamsSubscription.unsubscribe();
    if (this.userLoggedSubscription) this.userLoggedSubscription.unsubscribe();

    if (this.workflowLoadingSubscription)
      this.workflowLoadingSubscription.unsubscribe();
    if (this.workflowUpdateSubscription)
      this.workflowUpdateSubscription.unsubscribe();
    this.logger.debug('Destroying dashboard component');
  }
}
