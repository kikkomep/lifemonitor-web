import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AggregatedStatusStats } from 'src/app/models/stats.model';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { User } from 'src/app/models/user.modes';
import { Workflow } from 'src/app/models/workflow.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  // internal state
  private _workflowsStats: AggregatedStatusStats;
  private _workflows: Workflow[];
  private _workflow: Workflow;
  private _suite: Suite;
  private _testInstance: TestInstance;
  private _testBuild: TestBuild;
  private _currentUser: User;

  private loadingWorkflows = false;

  // initialize data sources
  private subjectWorkflows = new Subject<AggregatedStatusStats>();
  private subjectWorkflow = new Subject<Workflow>();
  private subjectTestSuite = new Subject<Suite>();
  private subjectTestInstance = new Subject<TestInstance>();
  private subjectTestBuild = new Subject<TestBuild>();

  // initialize data observables
  private _observableWorkflows = this.subjectWorkflows.asObservable();
  private _observableWorkflow = this.subjectWorkflow.asObservable();
  private _observableTestSuite = this.subjectTestSuite.asObservable();
  private _observableTestInstance = this.subjectTestInstance.asObservable();
  private _observableTestBuild = this.subjectTestBuild.asObservable();

  // subscriptions
  private subscriptions: Subscription[] = [];

  // session keys
  private WORKFLOW_UUID = 'workflow_uuid';
  private SUITE_UUID = 'suite_uuid';
  private TEST_INSTANCE_UUID = 'test_instance_uuid';
  private TEST_BUILD_ID = 'test_build_id';

  constructor(private api: ApiService, private http: HttpClient) {
    console.log('AppService created!');

    // subscribe for the current selected workflow
    this.subscriptions.push(
      this._observableWorkflow.subscribe((w: Workflow) => {
        this._workflow = w;
      })
    );

    // subscribe to the current user
    this.subscriptions.push(
      this.api.get_current_user().subscribe((data) => {
        console.log('Current user', data);
        this._currentUser = data;
      })
    );
  }

  public get currentUser(): User {
    return this._currentUser;
  }

  public get workflows(): Workflow[] {
    return this._workflows;
  }

  public get workflowStats(): AggregatedStatusStats {
    return this._workflowsStats;
  }

  public get workflow(): Workflow {
    return this._workflow;
  }

  public get testSuite(): Suite {
    return this._suite;
  }

  public get testInstance(): TestInstance {
    return this._testInstance;
  }

  public get testBuilds(): TestBuild {
    return this._testBuild;
  }

  public get observableWorkflows(): Observable<AggregatedStatusStats> {
    return this._observableWorkflows;
  }

  public get observableWorkflow(): Observable<Workflow> {
    return this._observableWorkflow;
  }

  public get observableTestSuite(): Observable<Suite> {
    return this._observableTestSuite;
  }

  public get observableTestInstance(): Observable<TestInstance> {
    return this._observableTestInstance;
  }

  public get observableTestBuild(): Observable<TestBuild> {
    return this._observableTestBuild;
  }

  public decodeUrl(url: string) {
    let data = JSON.parse(atob(url));
    return data;
  }

  loadWorkflows(useCache = false): Observable<Workflow> {
    if (this.loadingWorkflows) return;
    if (useCache && this._workflowsStats) {
      console.log('Using cache', this._workflowsStats);
      this.subjectWorkflows.next(this._workflowsStats);
      return;
    }
    let workflow: Subject<Workflow> = new Subject<Workflow>();
    this.loadingWorkflows = true;
    this.api.get_workflows().subscribe(
      (data) => {
        console.log('AppService Loaded workflows', data);

        // Workflow items
        let items = data['items'];
        let stats = new AggregatedStatusStats();
        items = items.map((i: object) => new Workflow(i));
        stats.update(items);

        this._workflows = items;
        this._workflowsStats = stats;
        this.loadingWorkflows = false;

        for (let w of this._workflows) {
          console.log('Loading data of workflow ', w);
          this.loadWorkflow(w).subscribe((wf: Workflow) => {});
        }
        this.subjectWorkflows.next(stats);
      },
      (error) => {
        console.error(error);
      }
    );

    return workflow.asObservable();
  }

  loadWorkflow(w: Workflow): Observable<Workflow> {
    return this.api.get_workflow(w.uuid).pipe(
      map((wdata: Workflow) => {
        console.log('Loaded data:', w);
        w.update(wdata);
        w.suites = wdata.suites;
        console.log('Workflow data updated!');
        return w;
      })
    );
  }

  public selectWorkflow(uuid: string) {
    let w: Workflow;
    console.log('Workflows', this._workflows, this._workflowsStats);
    if (this._workflow && this._workflow.uuid === uuid) {
      this._selectWorkflow(this._workflow);
    } else if (!this._workflows) {
      this.api.get_workflow(uuid, true, true, true).subscribe((w: Workflow) => {
        this._selectWorkflow(w);
      });
    } else {
      w = this._workflows.find((w: Workflow) => w.uuid === uuid);
      if (!w || !w.suites) {
        this.api
          .get_workflow(uuid, true, true, true)
          .subscribe((w: Workflow) => {
            this._selectWorkflow(w);
          });
      } else {
        this._selectWorkflow(w);
      }
    }
  }

  public changeWorkflowVisibility(w: Workflow): Observable<any> {
    return this.api.changeWorkflowVisibility(w);
  }

  public isEditable(workflow: Workflow): boolean {
    if (!this.currentUser || !workflow) {
      return false;
    }
    return this.currentUser.id === workflow.submitter['id'] ? true : false;
  }

  private _selectWorkflow(w: Workflow) {
    console.log('Selected workflow', w);
    this._workflow = w;
    this.subjectWorkflow.next(w);
  }

  public selectTestSuite(uuid: string) {
    if (this._suite && this._suite.uuid === uuid) {
      this._selectTestSuite(this._suite);
    } else if (!this._workflow) {
      this.api.getSuite(uuid).subscribe((suite: Suite) => {
        this._selectTestSuite(suite);
      });
    } else {
      let suite: Suite = this._workflow.suites.all.find(
        (s: Suite) => s.uuid === uuid
      ) as Suite;
      this._selectTestSuite(suite);
    }
  }

  private _selectTestSuite(suite: Suite) {
    console.log('Selected suite', suite);
    this._suite = suite;
    this.subjectTestSuite.next(suite);
  }

  public checkROCrateAvailability(workflow: Workflow): Observable<boolean> {
    return this.api.checkROCrateAvailability(workflow);
  }

  public downloadROCrate(workflow: Workflow) {
    this.api.downloadROCrate(workflow).subscribe((data) => {
      const blob = new Blob([data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    });
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    for (let s of this.subscriptions) {
      s.unsubscribe();
    }
  }
}
