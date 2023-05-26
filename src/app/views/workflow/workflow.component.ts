import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DOCUMENT, Location, ViewportScroller } from '@angular/common';
import {
  AggregatedStatusStatsItem,
  AggregatedTestStatusMap,
  StatusStatsItem,
} from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { WorkflowVersion } from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';
import { BaseDataViewComponent } from 'src/app/components/base-data-view/base-data-view.component';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss'],
})
export class WorkflowComponent
  extends BaseDataViewComponent
  implements OnInit, OnChanges {
  // current workflow
  public workflow: WorkflowVersion;
  // suites of the current workflow
  public suites: AggregatedStatusStatsItem[] = null;

  private internalParamSubscription: Subscription;
  private queryParamsSubscription: Subscription;
  private workflowSubscription: Subscription;
  private workflowChangesSubscription: Subscription;

  public selectedTestBuild: StatusStatsItem;

  public statusFilter: string | null;
  private _suiteNameFilter: string = '';
  public suiteSortingOrder: string = 'desc';

  // initialize logger
  private logger: Logger = LoggerManager.create('WorkflowComponent');

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    // private apiService: ApiService,
    private appService: AppService,
    protected readonly viewport: ViewportScroller,
    @Inject(DOCUMENT) protected readonly document: Document
  ) {
    super(viewport, document);
  }

  ngOnInit() {
    this.logger.debug('Created component Workflow');

    // subscribe for the current selected workflow
    this.workflowSubscription = this.appService.observableWorkflow.subscribe(
      (w: WorkflowVersion) => {
        this.logger.debug('Changed workflow', w, w.suites);
        this.workflow = w;
        this.workflowChangesSubscription = this.workflow
          .asObservable()
          .subscribe((change) => {
            if (this.statusFilter)
              this.suites = this.workflow.suites[this.statusFilter];
            else this.suites = this.workflow.suites.all;
            this.cdr.detectChanges();
            this.logger.debug('Handle change', change);
          });
        if (this.workflow.suites) {
          if (this.statusFilter)
            this.suites = this.workflow.suites[this.statusFilter];
          else this.suites = this.workflow.suites.all;
        }
      }
    );

    this.queryParamsSubscription = this.route.queryParams.subscribe(
      (params) => {
        this.logger.debug('Query params: ', params);
        if ('status' in params) {
          // Parse and normalize status filter
          let status: string = params['status'].toLowerCase();
          this.logger.debug('Status: ', status);
          for (let s in AggregatedTestStatusMap) {
            if (s === status || AggregatedTestStatusMap[s].includes(status)) {
              this.statusFilter = s;
            }
          }
        }
      }
    );

    this.internalParamSubscription = this.route.params.subscribe((params) => {
      // select a workflow
      this.appService.selectWorkflowVersion(params['uuid'], params['version']);
      this.appService
        .refreshWorkflowVersion(
          {
            uuid: params['uuid'],
            version: params['version'],
          },
          false
        )
        .then(() => {
          this.logger.debug('Refreshed workflow');
        });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.logger.debug('Change detected');
    this.cdr.detectChanges();
  }

  public set suiteNameFilter(value: string) {
    this._suiteNameFilter = value ? value.replace('SEARCH_KEY###', '') : '';
  }

  public get suiteNameFilter(): string {
    return this._suiteNameFilter;
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
        // remove status param from query
        const queryParams = { ...this.route.snapshot.queryParams };
        delete queryParams.status;
        this.router.navigate([], { queryParams: queryParams });
      }
    } catch (e) {
      this.logger.debug(e);
    }
  }

  public selectTestBuild(testBuild: TestBuild) {
    this.logger.debug('Test Build selected', testBuild);
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.internalParamSubscription.unsubscribe();
    this.workflowSubscription.unsubscribe();
    if (this.workflowChangesSubscription)
      this.workflowChangesSubscription.unsubscribe();
    if (this.queryParamsSubscription)
      this.queryParamsSubscription.unsubscribe();
  }
}
