import {
  ChangeDetectorRef,
  Component,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  AggregatedStatusStatsItem,
  StatusStatsItem
} from 'src/app/models/stats.model';
import { TestBuild } from 'src/app/models/testBuild.models';
import { Workflow } from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';


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

  // initialize logger
  private logger: Logger = LoggerManager.create('WorkflowComponent');

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    // private apiService: ApiService,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.logger.debug('Created component Workflow');

    // subscribe for the current selected workflow
    this.workflowSubscription = this.appService.observableWorkflow.subscribe(
      (w: Workflow) => {
        this.logger.debug('Changed workflow', w, w.suites);
        this.workflow = w;
        this.workflowChangesSubscription = this.workflow
          .asObservable()
          .subscribe((change) => {
            this.suites = this.workflow.suites.all;
            this.cdr.detectChanges();
            this.logger.debug('Handle change', change);
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
    this.logger.debug('Change detected');
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
      this.logger.debug(e);
    }
  }

  public selectTestBuild(testBuild: TestBuild) {
    this.logger.debug('Test Build selected', testBuild);
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.paramSubscription.unsubscribe();
    this.workflowSubscription.unsubscribe();
    if (this.workflowChangesSubscription)
      this.workflowChangesSubscription.unsubscribe();
  }
}
