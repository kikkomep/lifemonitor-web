import { AuthService } from 'src/app/utils/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { map, finalize, catchError } from 'rxjs/operators';
import { AggregatedStatusStats } from 'src/app/models/stats.model';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { User } from 'src/app/models/user.modes';
import { Workflow } from 'src/app/models/workflow.model';
import { ApiService } from './api.service';
import { Registry, RegistryWorkflow } from 'src/app/models/registry.models';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  // internal state
  private _registry: Registry;
  private _registries: Registry[];
  private _registryWorkflow: RegistryWorkflow;
  private _registryWorkflows: { [uuid: string]: RegistryWorkflow[] } = {};
  private _workflowsStats: AggregatedStatusStats;
  private _workflows: Workflow[];
  private _workflow: Workflow;
  private _suite: Suite;
  private _testInstance: TestInstance;
  private _testBuild: TestBuild;
  private _currentUser: User;

  private loadingWorkflows = false;

  // initialize data sources
  private subjectRegistry = new Subject<Registry>();
  private subjectRegistries = new Subject<Registry[]>();
  private subjectRegistryWorkflow = new Subject<RegistryWorkflow>();
  private subjectRegistryWorkflows = new Subject<RegistryWorkflow[]>();
  private subjectWorkflows = new Subject<AggregatedStatusStats>();
  private subjectWorkflow = new Subject<Workflow>();
  private subjectTestSuite = new Subject<Suite>();
  private subjectTestInstance = new Subject<TestInstance>();
  private subjectTestBuild = new Subject<TestBuild>();
  private subjectLoadingWorkflows = new Subject<boolean>();

  // initialize data observables
  private _observableRegistry = this.subjectRegistry.asObservable();
  private _observableRegistries = this.subjectRegistries.asObservable();
  private _observableRegistryWorkflow = this.subjectRegistryWorkflow.asObservable();
  private _observableRegistryWorkflows = this.subjectRegistryWorkflows.asObservable();
  private _observableWorkflows = this.subjectWorkflows.asObservable();
  private _observableWorkflow = this.subjectWorkflow.asObservable();
  private _observableTestSuite = this.subjectTestSuite.asObservable();
  private _observableTestInstance = this.subjectTestInstance.asObservable();
  private _observableTestBuild = this.subjectTestBuild.asObservable();
  private _observableLoadingWorkflows = this.subjectLoadingWorkflows.asObservable();

  // subscriptions
  private subscriptions: Subscription[] = [];

  // session keys
  private WORKFLOW_UUID = 'workflow_uuid';
  private SUITE_UUID = 'suite_uuid';
  private TEST_INSTANCE_UUID = 'test_instance_uuid';
  private TEST_BUILD_ID = 'test_build_id';

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private http: HttpClient
  ) {
    console.log('AppService created!');

    // subscribe for the current selected workflow
    this.subscriptions.push(
      this._observableWorkflow.subscribe((w: Workflow) => {
        this._workflow = w;
      })
    );

    // subscribe to the current user
    this.subscriptions.push(
      this.auth.userLoggedAsObservable().subscribe((logged) => {
        // get user data
        if (logged === true) {
          this.api.get_current_user().subscribe((data) => {
            console.log('Current user from APP', data);
            this._currentUser = data;
          });
        } else {
          // reset the current list of workflows
          this._workflowsStats.update([]);
          this.subjectWorkflows.next(this._workflowsStats);
          // reload workflows
          this.loadWorkflows(false, false).subscribe((data) => {
            // delete reference to the previous user
            this._currentUser = null;
          });
        }
      })
    );

    // get user data if already logged
    if (this.auth.isUserLogged()) {
      this.api.get_current_user().subscribe((data) => {
        console.log('Current user from APP', data);
        this._currentUser = data;
      });
    }
  }

  public isUserLogged(): boolean {
    return this.auth.isUserLogged();
  }

  private setLoadingWorkflows(value: boolean) {
    this.loadingWorkflows = value;
    this.subjectLoadingWorkflows.next(value);
  }

  public isLoadingWorkflows(): boolean {
    return this.loadingWorkflows;
  }

  public get isLoadingWorkflowsAsObservable(): Observable<boolean> {
    return this._observableLoadingWorkflows;
  }

  public login() {
    return this.auth.login();
  }

  public authorize() {
    return this.auth.authorize();
  }

  public logout() {
    return this.auth.logout();
  }

  public get currentUser(): User {
    return this._currentUser;
  }

  public get registry(): Registry {
    return this._registry;
  }

  public get registries(): Registry[] {
    return this._registries;
  }

  public get registryWorkflow(): RegistryWorkflow {
    return this._registryWorkflow;
  }

  public get registryWorkflows(): RegistryWorkflow[] {
    return this.getRegistryWorkflows();
  }

  public getRegistryWorkflows(uuid: string = null): RegistryWorkflow[] {
    let registry_uuid = uuid
      ? uuid
      : this._registry
        ? this._registry.uuid
        : null;
    if (!registry_uuid) return null;
    return this._registryWorkflows[registry_uuid];
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

  public get observableRegistry(): Observable<Registry> {
    return this._observableRegistry;
  }

  public get observableRegistries(): Observable<Registry[]> {
    return this._observableRegistries;
  }

  public get observableRegistryWorkflow(): Observable<RegistryWorkflow> {
    return this._observableRegistryWorkflow;
  }

  public get observableRegistryWorkflows(): Observable<RegistryWorkflow[]> {
    return this._observableRegistryWorkflows;
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

  public subscribeWorkflow(w: Workflow): Observable<Workflow> {
    return this.api.subscribeWorkflow(w);
  }

  public unsubscribeWorkflow(w: Workflow): Observable<Workflow> {
    return this.api.unsubscribeWorkflow(w);
  }

  public loadRegistries(): Observable<Registry[]> {
    return this.api.getRegistries().pipe(
      map((data: Registry[]) => {
        this._registries = data;
        this.subjectRegistries.next(this._registries);
        return this._registries;
      })
    );
  }

  private findRegistryByUuid(uuid: string): Registry {
    if (!this._registries) return null;
    return this._registries.find(e => e.uuid === uuid);
  }

  public selectRegistry(uuid: string, useCache: boolean = true) {
    console.log('Selecting registry ', uuid);
    this._registry = this.findRegistryByUuid(uuid);
    this.subjectRegistry.next(this._registry);
    if (this._registry) {
      if (uuid in this._registryWorkflows && useCache) {
        console.log('Using cached workflows');
        this.subjectRegistryWorkflows.next(this._registryWorkflows[uuid]);
      } else {
        this.api.getRegistryWorkflows(uuid).subscribe((data: RegistryWorkflow[]) => {
          console.log('Loaded registry workflows...', data);
          let sorted = data.sort((a, b) => {
            return a.identifier.localeCompare(b.identifier, undefined, {
              numeric: true,
              sensitivity: 'base'
            })
          })
          this._registryWorkflows[uuid] = sorted;
          this.subjectRegistryWorkflows.next(sorted);
        });
      }
    }
  }

  public selectRegistryWorkflow(workflow_identifier: string) {
    // TODO: enable caching
    this.api.getRegistryWorkflow(this.registry.uuid, workflow_identifier)
      .subscribe((w: RegistryWorkflow) => {
        console.log("Loaded registry workflow data", w);
        this._registryWorkflow = w;
        this.subjectRegistryWorkflow.next(w);
      });
  }

  loadWorkflows(
    useCache = false,
    filteredByUser: boolean = undefined,
    includeSubScriptions: boolean = undefined
  ): Observable<AggregatedStatusStats> {
    if (this.loadingWorkflows) return;
    if (useCache && this._workflowsStats) {
      console.log('Using cache', this._workflowsStats);
      this.subjectWorkflows.next(this._workflowsStats);
      return;
    }

    this.setLoadingWorkflows(true);
    this.api
      .get_workflows(
        filteredByUser !== undefined ? filteredByUser : this.isUserLogged(),
        includeSubScriptions !== undefined
          ? includeSubScriptions
          : this.isUserLogged()
      )
      .pipe(
        finalize(() => {
          this.setLoadingWorkflows(false);
        })
      )
      .subscribe(
        (data) => {
          console.log('AppService Loaded workflows', data);

          // Workflow items
          let items = data['items'];
          let stats = new AggregatedStatusStats();
          items = items.map((i: object) => new Workflow(i));
          stats.update(items);

          this._workflows = items;
          this._workflowsStats = stats;

          for (let w of this._workflows) {
            console.log('Loading data of workflow ', w);
            this.loadWorkflow(w).subscribe((wf: Workflow) => { });
          }
          this.subjectWorkflows.next(stats);
        },
        (error) => {
          console.error(error);
        }
      );

    return this.subjectWorkflows.asObservable();
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

  public registerWorkflowRoCrate(
    uuid: string,
    version: string,
    url: string = null,
    rocrate: string = null,
    name: string = null,
    is_public: boolean = false,
    authorization: string = null
  ): Observable<object> {
    this.setLoadingWorkflows(true);
    return this.api
      .registerWorkflowRoCrate(
        uuid,
        version,
        url,
        rocrate,
        name,
        is_public,
        authorization
      )
      .pipe(
        map((data) => {
          console.log('Data of registered workflow', data);
          this.api.get_workflow(data['uuid']).subscribe((w: Workflow) => {
            console.log('Loaded data:', w);
            // TODO: atomic add
            this._workflows.push(w);
            this._workflowsStats.add(w);
            console.log('Workflow data loaded!');
            this.subjectWorkflows.next(this._workflowsStats);
            this.setLoadingWorkflows(false);
          });
          return data;
        }),
        catchError((err) => {
          console.log('Error when registering workflow', err);
          this.setLoadingWorkflows(false);
          throw err;
        }),
        finalize(() => {
          // this.setLoadingWorkflows(false);
        })
      );
  }


  public registerRegistryWorkflow(
    workflow: RegistryWorkflow,
    version: string,
    name: string = null,
    is_public: boolean = false
  ): Observable<object> {
    this.setLoadingWorkflows(true);
    return this.api
      .registerRegistryWorkflow(
        workflow,
        version,
        name && name.length > 0 ? name : workflow.name,
        is_public
      )
      .pipe(
        map((data) => {
          console.log('Data of registered workflow', data);
          this.api.get_workflow(data['uuid']).subscribe((w: Workflow) => {
            console.log('Loaded data:', w);
            // TODO: atomic add
            this._workflows.push(w);
            this._workflowsStats.add(w);
            console.log('Workflow data loaded!');
            this.subjectWorkflows.next(this._workflowsStats);
            this.setLoadingWorkflows(false);
          });
          return data;
        }),
        catchError((err) => {
          console.log('Error when registering workflow', err);
          this.setLoadingWorkflows(false);
          throw err;
        }),
        finalize(() => {
          // this.setLoadingWorkflows(false);
        })
      );
  }

  public deleteWorkflowVersion(w: Workflow, version: string):
    Observable<{ uuid: string; version: string }> {
    this.setLoadingWorkflows(true);
    return this.api.deleteWorkflowVersion(w.uuid, version).pipe(
      map((wd: { uuid: string; version: string }) => {
        const index = this._workflows.findIndex(obj => obj.uuid === w.uuid && obj.version['version'] === version);
        if (index > -1) {
          this._workflows.splice(index, 1);
          this._workflowsStats.remove(w);
          this.subjectWorkflows.next(this._workflowsStats);
          this.setLoadingWorkflows(false);
        }
        console.log("Workflow removed");
        return wd;
      }),
      catchError((err) => {
        console.log('Error when deleting workflow', err);
        this.setLoadingWorkflows(false);
        throw err;
      }),
      finalize(() => {
        // this.setLoadingWorkflows(false);
      })
    )
  }

  public changeWorkflowVisibility(w: Workflow): Observable<any> {
    return this.api.changeWorkflowVisibility(w);
  }

  public isEditable(workflow: Workflow): boolean {
    if (!this.currentUser || !workflow || !workflow.submitter) {
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
