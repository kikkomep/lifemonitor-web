import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { StatusStatsItem } from 'src/app/models/stats.model';
import { Suite } from 'src/app/models/suite.models';
import { Workflow } from 'src/app/models/workflow.model';
import { Logger, LoggerManager } from 'src/app/utils/logging';
import { AppService } from 'src/app/utils/services/app.service';

@Component({
  selector: 'test-suite',
  templateUrl: './suite.component.html',
  styleUrls: ['./suite.component.scss'],
})
export class SuiteComponent implements OnInit {
  @Input() suite: Suite;

  public statusFilter: string = null;
  private _instanceNameFilter: string = '';
  public instanceSortingOrder: string = 'desc';

  private _instances: StatusStatsItem[] = [];

  private paramSubscription: Subscription;
  private workflowSubscription: Subscription;
  private suiteSubscription: Subscription;

  // initialize logger
  private logger: Logger = LoggerManager.create('SuiteComponent');

  constructor(
    private route: ActivatedRoute,
    private appService: AppService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.logger.debug('Created component Workflow');
    this.paramSubscription = this.route.params.subscribe((params) => {
      this.logger.debug('Params:', params);

      let urlData = this.appService.decodeUrl(params['s']);
      this.logger.debug('UrlData', urlData);

      // subscribe for the current selected workflow
      this.workflowSubscription = this.appService.observableWorkflow.subscribe(
        (w: Workflow) => {
          this.logger.debug('Changed workflow', w, w.suites);

          // subscribe for the current selected suite
          this.suiteSubscription = this.appService.observableTestSuite.subscribe(
            (suite: Suite) => {
              this.logger.debug('Changed suite', suite);
              if (suite) {
                this.suite = suite;
                this.suite.workflow = w;
                this._instances = suite.instances.all;
              }
            }
          );

          // // select the suite with uuid = params['uuid']
          this.appService.selectTestSuite(urlData['suite']);
        }
      );

      // select a workflow
      this.appService.selectWorkflow(urlData['workflow']);
    });
  }

  public filterByStatus(status: string) {
    if (!this.suite) return;
    try {
      status = status == 'any' ? 'all' : status;
      if (status != this.statusFilter) {
        this._instances = this.suite.instances[status];
        this.statusFilter = status;
        this.instanceNameFilter = '';
      } else {
        this._instances = this.suite.instances['all'];
        this.statusFilter = null;
      }
    } catch (e) {
      this.logger.debug(e);
    }
  }

  public get instanceNameFilter(): string {
    return this._instanceNameFilter;
  }

  public set instanceNameFilter(value: string) {
    this._instanceNameFilter = value ? value.replace("SEARCH_KEY###", "") : "";
  }

  public get instances(): StatusStatsItem[] {
    return this._instances;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.logger.debug('Change detected');
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    this.paramSubscription.unsubscribe();
    this.suiteSubscription.unsubscribe();
    this.workflowSubscription.unsubscribe();
    // this.workflowChangesSubscription.unsubscribe();
  }
}
