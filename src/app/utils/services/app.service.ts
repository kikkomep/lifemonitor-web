import { AuthService } from 'src/app/utils/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { map, finalize, catchError, tap } from 'rxjs/operators';
import { AggregatedStatusStats } from 'src/app/models/stats.model';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { User } from 'src/app/models/user.modes';
import {
  Workflow,
  WorkflowVersion,
  WorkflowVersionDescriptor,
} from 'src/app/models/workflow.model';
import { ApiService } from './api.service';
import { Registry, RegistryWorkflow } from 'src/app/models/registry.models';
import { UserNotification } from 'src/app/models/notification.model';
import { Logger, LoggerManager } from '../logging';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  // internal state
  private _notifications: UserNotification[];
  private _registry: Registry;
  private _registries: Registry[];
  private _registryWorkflow: RegistryWorkflow;
  private _registryWorkflows: { [uuid: string]: RegistryWorkflow[] } = {};
  private _workflows: Workflow[];
  private _workflow_versions: WorkflowVersion[];
  private _workflow: WorkflowVersion;
  private _suite: Suite;
  private _testInstance: TestInstance;
  private _testBuild: TestBuild;
  private _currentUser: User;

  private loadingWorkflows = false;

  // initialize data sources
  private subjectNotifications = new Subject<UserNotification[]>();
  private subjectRegistry = new Subject<Registry>();
  private subjectRegistries = new Subject<Registry[]>();
  private subjectRegistryWorkflow = new Subject<RegistryWorkflow>();
  private subjectRegistryWorkflows = new Subject<RegistryWorkflow[]>();
  private subjectWorkflows = new Subject<Workflow[]>();
  private subjectWorkflow = new Subject<WorkflowVersion>();
  private subjectTestSuite = new Subject<Suite>();
  private subjectTestInstance = new Subject<TestInstance>();
  private subjectTestBuild = new Subject<TestBuild>();
  private subjectLoadingWorkflows = new Subject<boolean>();

  // initialize data observables
  private _observableNotifications = this.subjectNotifications.asObservable();
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

  // Initialize logger
  private logger: Logger = LoggerManager.create('AppService');

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
    this.logger.debug('AppService created!');

    // subscribe for the current selected workflow
    this.subscriptions.push(
      this._observableWorkflow.subscribe((w: WorkflowVersion) => {
        this._workflow = w;
      })
    );

    // subscribe to the current user
    this.subscriptions.push(
      this.auth.userLoggedAsObservable().subscribe((logged) => {
        // get user data
        if (logged === true) {
          this.api.get_current_user().subscribe((data) => {
            this.logger.debug('Current user from APP', data);
            this._currentUser = data;
          });
        } else {
          // reload workflows
          this.loadWorkflows(true, false, false).subscribe(
            (data: AggregatedStatusStats) => {
              // delete reference to the previous user
              this._currentUser = null;
              this._workflow = null;
              this.logger.debug('Check workflows loaded: ', data);
              this.subjectWorkflows.next(this._workflows);
            }
          );
        }
      })
    );

    // get user data if already logged
    if (this.auth.isUserLogged()) {
      this.api.get_current_user().subscribe((data) => {
        this.logger.debug('Current user from APP', data);
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

  public get workflow_versions(): WorkflowVersion[] {
    return this._workflow_versions;
  }

  public findWorkflow(uuid: string): Workflow {
    return this._workflows
      ? this._workflows.find((w) => w.uuid === uuid)
      : null;
  }

  public findWorkflowVersion(uuid: string, version: string): WorkflowVersion {
    return this._workflow_versions
      ? this._workflow_versions.find(
          (w) => w.uuid === uuid && w.version['version'] === version
        )
      : null;
  }

  public get workflow(): WorkflowVersion {
    return this._workflow;
  }

  public get testSuite(): Suite {
    return this._suite;
  }

  public get notifications(): UserNotification[] {
    return this._notifications;
  }

  public findTestSuite(suite_uuid: string, wf_uuid: string = null): Suite {
    if (!this._workflow && !wf_uuid) return null;
    let workflow: WorkflowVersion = this._workflow;
    if (wf_uuid && this._workflow_versions) {
      workflow = this._workflow_versions.find((w) => w.uuid === wf_uuid);
    }
    if (!workflow) return null;
    return workflow.suites
      ? (workflow.suites.all.find((s) => s.uuid === suite_uuid) as Suite)
      : null;
  }

  public get testInstance(): TestInstance {
    return this._testInstance;
  }

  public get testBuilds(): TestBuild {
    return this._testBuild;
  }

  public get observableUserLogged(): Observable<boolean> {
    return this.auth.userLoggedAsObservable();
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

  public get observableWorkflows(): Observable<Workflow[]> {
    return this._observableWorkflows;
  }

  public get observableWorkflow(): Observable<WorkflowVersion> {
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

  public get observableNotifications(): Observable<UserNotification[]> {
    return this._observableNotifications;
  }

  public decodeUrl(url: string) {
    let data = JSON.parse(atob(url));
    return data;
  }

  public subscribeWorkflow(w: WorkflowVersion): Observable<WorkflowVersion> {
    return this.api.subscribeWorkflow(w).pipe(
      tap((wd: WorkflowVersion) => {
        this.logger.debug('Added subscription to workflow: ', wd);
      })
    );
  }

  public unsubscribeWorkflow(w: WorkflowVersion): Observable<WorkflowVersion> {
    return this.api.unsubscribeWorkflow(w).pipe(
      tap((wd: WorkflowVersion) => {
        this.logger.debug('Removed subscription to workflow: ', wd);
      })
    );
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
    return this._registries.find((e) => e.uuid === uuid);
  }

  public selectRegistry(uuid: string, useCache: boolean = true) {
    this.logger.debug('Selecting registry ', uuid);
    this._registry = this.findRegistryByUuid(uuid);
    this.subjectRegistry.next(this._registry);
    if (this._registry) {
      if (uuid in this._registryWorkflows && useCache) {
        this.logger.debug('Using cached workflows');
        this.subjectRegistryWorkflows.next(this._registryWorkflows[uuid]);
      } else {
        this.api
          .getRegistryWorkflows(uuid)
          .subscribe((data: RegistryWorkflow[]) => {
            this.logger.debug('Loaded registry workflows...', data);
            let sorted = data.sort((a, b) => {
              return a.identifier.localeCompare(b.identifier, undefined, {
                numeric: true,
                sensitivity: 'base',
              });
            });
            this._registryWorkflows[uuid] = sorted;
            this.subjectRegistryWorkflows.next(sorted);
          });
      }
    }
  }

  public selectRegistryWorkflow(workflow_identifier: string) {
    // TODO: enable caching
    this.api
      .getRegistryWorkflow(this.registry.uuid, workflow_identifier)
      .subscribe((w: RegistryWorkflow) => {
        this.logger.debug('Loaded registry workflow data', w);
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
    // if (useCache && this._workflowsStats) {
    //   this.logger.debug('Using cache', this._workflowsStats);
    //   this.subjectWorkflows.next(this._workflowsStats);
    //   return;
    // }

    this.setLoadingWorkflows(true);
    return this.api
      .get_workflows(
        filteredByUser !== undefined ? filteredByUser : this.isUserLogged(),
        includeSubScriptions !== undefined
          ? includeSubScriptions
          : this.isUserLogged()
      )
      .pipe(
        map((data) => {
          this.logger.debug('AppService Loaded workflows', data);

          // Process workflow items
          let stats = new AggregatedStatusStats();
          let workflows: Workflow[] = [];
          let workflow_versions: WorkflowVersion[] = [];
          for (let wdata of data['items']) {
            let workflow: Workflow = null;
            let workflow_version: WorkflowVersion = null;
            // Try to get workflow data from cache if it is enabled
            if (useCache && this._workflow_versions) {
              workflow_version = this._workflow_versions.find(
                (e) => e['uuid'] === wdata['uuid']
              );
              this.logger.debug(
                'Using data from cache for worklow: ',
                workflow_version
              );
            }
            // Load workflow data from the back-end
            // if cache is disabled or it has not been found
            if (!workflow_version) {
              workflow = new Workflow(wdata);
              workflows.push(workflow);
              this.logger.debug('Loading data of workflow ', workflow_version);
              this.loadWorkflowVersion(workflow).subscribe(
                (wf: WorkflowVersion) => {
                  workflow_version = wf;
                  workflow.addVersion(workflow_version, true);
                  workflow_versions.push(workflow_version);
                  // workflow.currentVersion = workflow_version;
                  stats.add(workflow_version);
                  this.subjectWorkflows.next(this._workflows);
                  this.logger.debug(
                    'Data loaded for workflow',
                    workflow_version.uuid,
                    workflow_versions,
                    stats
                  );
                }
              );
            }
            // Add workflow to the list of loaded workflows
            else {
              workflow_versions.push(workflow_version);
            }
          }

          this.logger.debug(
            'Workflow Versions: ',
            workflows,
            workflow_versions
          );

          // Update list of workflows and notify observers
          stats.update(workflow_versions);
          this._workflows = workflows;
          this._workflow_versions = workflow_versions;
          this.subjectWorkflows.next(this._workflows);
          return stats;
        }),
        finalize(() => {
          this.setLoadingWorkflows(false);
        })
      );
  }

  // loadWorkflow(
  //   useCache = false,
  //   filteredByUser: boolean = undefined,
  //   includeSubScriptions: boolean = undefined
  // ): Observable<Workflow> {
  //   return this.api
  //   .get_workflow(
  //     filteredByUser !== undefined ? filteredByUser : this.isUserLogged(),
  //     includeSubScriptions !== undefined
  //       ? includeSubScriptions
  //       : this.isUserLogged()
  //   )
  //   .pipe(
  //     map((data) => {
  //       this.logger.debug('AppService Loaded workflows', data);
  //     })
  //   );

  // }

  loadWorkflowVersion(
    w: Workflow,
    version: string = 'latest'
  ): Observable<WorkflowVersion> {
    return this.api.get_workflow_version(w.uuid, version, true, true).pipe(
      map((workflow_version: WorkflowVersion) => {
        this.logger.debug('Loaded data:', workflow_version);
        //w.update(wdata);
        //w.suites = wdata.suites;
        this.logger.debug('Workflow data updated!');
        return workflow_version;
      })
    );
  }

  public selectWorkflowVersion(uuid: string, version: string = 'latest') {
    let w: WorkflowVersion;
    this.logger.debug(
      'Selecting workflow',
      uuid,
      version,
      this._workflow_versions
    );
    if (
      this._workflow &&
      this._workflow.uuid === uuid &&
      this._workflow.version['version'] === version
    ) {
      this._selectWorkflowVersion(this._workflow);
    } else if (!this._workflow_versions) {
      this.api
        .get_workflow_version(uuid, version, true, true, true)
        .subscribe((w: WorkflowVersion) => {
          this._selectWorkflowVersion(w);
        });
    } else {
      w = this._workflow_versions.find(
        (w: WorkflowVersion) =>
          w.uuid === uuid && w.version['version'] === version
      );
      if (!w || !w.suites) {
        this.api
          .get_workflow_version(uuid, version, true, true, true)
          .subscribe((w: WorkflowVersion) => {
            this._selectWorkflowVersion(w);
          });
      } else {
        this._selectWorkflowVersion(w);
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
          this.logger.debug('Data of registered workflow', data);
          this.api
            .get_workflow_version(data['uuid'], version, false, true)
            .subscribe((workflow_version: WorkflowVersion) => {
              this.logger.debug('Registered Workflow RO-Crate:', workflow_version);
              this._workflow_versions.push(workflow_version);
              this.logger.debug('Workflow data loaded!');
              if (!this.findWorkflow(uuid)) {
                this.api.get_workflow(uuid).subscribe((workflow: Workflow) => {
                  workflow.addVersion(workflow_version, true);
                  this._workflows.push(workflow);
                  this.subjectWorkflows.next(this._workflows);
                  this.setLoadingWorkflows(false);
                });
              } else {
                this.subjectWorkflows.next(this._workflows);
                this.setLoadingWorkflows(false);
              }
            });
          return data;
        }),
        catchError((err) => {
          this.logger.debug('Error when registering workflow', err);
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
          this.logger.debug('Data of registered workflow', data);
          this.api
            .get_workflow_version(data['uuid'], version, false, true)
            .subscribe((workflow_version: WorkflowVersion) => {
              this.logger.debug('Registered Workflow RO-Crate:', workflow_version);
              this._workflow_versions.push(workflow_version);
              this.logger.debug('Workflow data loaded!');
              if (!this.findWorkflow(workflow_version.uuid)) {
                this.api.get_workflow(workflow_version.uuid).subscribe((workflow: Workflow) => {
                  workflow.addVersion(workflow_version, true);
                  this._workflows.push(workflow);
                  this.subjectWorkflows.next(this._workflows);
                  this.setLoadingWorkflows(false);
                });
              } else {
                this.subjectWorkflows.next(this._workflows);
                this.setLoadingWorkflows(false);
              }
            });
          return data;
        }),
        catchError((err) => {
          this.logger.debug('Error when registering workflow', err);
          this.setLoadingWorkflows(false);
          throw err;
        }),
        finalize(() => {
          // this.setLoadingWorkflows(false);
        })
      );
  }

  public deleteWorkflowVersion(
    workflow_version: WorkflowVersion
  ): Observable<{ uuid: string; version: string }> {
    if (!workflow_version) return;
    let workflow: Workflow = workflow_version.workflow;
    this.setLoadingWorkflows(true);
    return this.api
      .deleteWorkflowVersion(
        workflow_version.uuid,
        workflow_version.version['version']
      )
      .pipe(
        map((wd: { uuid: string; version: string }) => {
          const versionIndex = workflow.findIndex(workflow_version);
          this.logger.debug('Version index: ', versionIndex);
          if (versionIndex > -1) {
            this._workflow_versions.splice(versionIndex, 1);
            let nextVersionDescriptor: WorkflowVersionDescriptor = workflow.pickVersion(
              [workflow_version.version['version']]
            );
            this.logger.debug('Next version: ', nextVersionDescriptor);
            if (nextVersionDescriptor) {
              this.loadWorkflowVersion(
                workflow,
                nextVersionDescriptor.name
              ).subscribe(
                (wv: WorkflowVersion) => {
                  workflow.addVersion(wv, true);
                  workflow.removeVersion(workflow_version);
                  this.subjectWorkflows.next(this._workflows);
                  this.setLoadingWorkflows(false);
                },
                catchError((e) => {
                  this.setLoadingWorkflows(false);
                  throw e;
                })
              );
            } else {
              workflow.removeVersion(workflow_version);
              this.subjectWorkflows.next(this._workflows);
              this.setLoadingWorkflows(false);
            }
          }
          this.logger.debug('Workflow removed');
          return wd;
        }),
        catchError((err) => {
          this.logger.debug('Error when deleting workflow', err);
          this.setLoadingWorkflows(false);
          throw err;
        }),
        finalize(() => {
          // this.setLoadingWorkflows(false);
        })
      );
  }

  public updateWorkflowName(w: WorkflowVersion): Observable<any> {
    return this.api.updateWorkflowName(w);
  }

  public updateSuite(suite: Suite): Observable<any> {
    return this.api.updateSuite(suite);
  }

  public updateTestInstance(instance: TestInstance): Observable<any> {
    return this.api.updateTestInstance(instance);
  }

  public changeWorkflowVisibility(w: WorkflowVersion): Observable<any> {
    return this.api.changeWorkflowVisibility(w);
  }

  public isEditable(workflow: WorkflowVersion): boolean {
    if (!this.currentUser || !workflow || !workflow.submitter) {
      return false;
    }
    return this.currentUser.id === workflow.submitter['id'] ? true : false;
  }

  private _selectWorkflowVersion(w: WorkflowVersion) {
    this.logger.debug('Selected workflow', w);
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
    this.logger.debug('Selected suite', suite);
    this._suite = suite;
    this.subjectTestSuite.next(suite);
  }

  public checkROCrateAvailability(
    workflow: WorkflowVersion
  ): Observable<boolean> {
    return this.api.checkROCrateAvailability(workflow);
  }

  public downloadROCrate(workflow: WorkflowVersion) {
    this.api.downloadROCrate(workflow).subscribe((data) => {
      const blob = new Blob([data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    });
  }

  public loadNotifications(): Observable<UserNotification[]> {
    return this.api.get_current_user_notifications().pipe(
      map((notifications: UserNotification[]) => {
        this._notifications = notifications;
        this.subjectNotifications.next(notifications);
        return notifications;
      }),
      catchError((err) => {
        this.logger.debug('Error', err);
        // this.setLoadingWorkflows(false);
        throw err;
      }),
      finalize(() => {
        // this.setLoadingWorkflows(false);
      })
    );
  }

  public setNotificationsReadingTime(
    notifications: UserNotification[]
  ): Observable<object> {
    return this.api.setNotificationsReadingTime(notifications);
  }

  public deleteNotification(
    notification: UserNotification
  ): Observable<object> {
    return this.api.deleteNotification(notification);
  }

  public deleteNotifications(
    notifications: UserNotification[]
  ): Observable<object> {
    return this.api.deleteNotifications(notifications);
  }

  ngOnDestroy() {
    // prevent memory leak when component destroyed
    for (let s of this.subscriptions) {
      s.unsubscribe();
    }
  }
}
