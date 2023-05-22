import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Socket } from 'ngx-socket-io';
import { forkJoin, from, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, map, mergeMap, retry, tap } from 'rxjs/operators';
import { Job } from 'src/app/models/job.model';
import { UserNotification } from 'src/app/models/notification.model';
import { Registry, RegistryWorkflow } from 'src/app/models/registry.models';
import {
  AggregatedStatusStats,
  InstanceStats,
  Status,
} from 'src/app/models/stats.model';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { User } from 'src/app/models/user.modes';
import { Workflow, WorkflowVersion } from 'src/app/models/workflow.model';
import { v4 as uuidv4 } from 'uuid';
import { Logger, LoggerManager } from '../logging';
import { AuthService } from './auth.service';
import { CacheManager, FetchError } from './cache/cache-manager';
import { CachedHttpClientService } from './cache/cachedhttpclient.service';
import { AppConfigService } from './config.service';
import { ApiSocket } from '../shared/api-socket';

const MAX_RETRIES = 0;

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private httpOptions: object = null;

  // initialize logger
  private logger: Logger = LoggerManager.create('ApiService');

  private workflowVersionCreated = new Subject<{
    uuid: string;
    version: string;
  }>();
  public onWorkflowVersionCreated: Observable<{
    uuid: string;
    version: string;
  }> = this.workflowVersionCreated.asObservable();

  public onWorkflowVersionUpdate: Observable<{
    uuid: string;
    version: string;
  }> = this.cachedHttpClient.onWorkflowVersionUpdate;

  public onWorkflowVersionDeleted: Observable<{
    uuid: string;
    version: string;
  }> = this.cachedHttpClient.onWorkflowVersionDeleted;

  constructor(
    private http: HttpClient,
    private config: AppConfigService,
    private cachedHttpClient: CachedHttpClientService,
    private authService: AuthService
  ) {
    this.logger.debug('API Service created');
    // propagate cache events
    this.cachedHttpClient.onWorkflowVersionCreated.subscribe((w) => {
      this.workflowVersionCreated.next(w);
    });
  }

  public get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  private handleWorkerMessage(
    event: MessageEvent<{ type: string; payload: object }>
  ) {
    this.logger.debug(`Received message from worker: ${event.data.type}`);
    if (this[event.data.type]) {
      this[event.data.type](event.data.payload);
    }
  }

  public get socketIO(): ApiSocket {
    return this.cachedHttpClient.socketIO;
  }

  public get cache(): CacheManager {
    return this.cachedHttpClient.cache;
  }

  public get jobs$(): Observable<Job> {
    return this.cachedHttpClient.jobs$;
  }

  private entityUpdated(entity: {
    key: string;
    data: {
      request: object;
      response: object;
      created_at: number;
      meta: object;
    };
  }) {
    this.logger.debug('Serving update entity event', entity);
    localStorage.removeItem(entity.key);
    localStorage.setItem(entity.key, JSON.stringify(entity.data));
  }

  private get_http_options(params = {}, skip: boolean = false) {
    const token = this.authService.token;
    let http_headers = {
      'Content-Type': 'application/json',
      skip: String(skip),
    };
    if (token) {
      // http_headers['Authorization'] = 'Bearer ' + token['token']['value'];
      http_headers['Authorization'] = 'Bearer ' + token.token.value;
    }
    let http_options = {
      //headers: new HttpHeaders(http_headers),
      headers: http_headers,
      params: params,
    };
    return http_options;
  }

  private workflowToCacheGroup(
    uuid: string,
    version?: string // = 'latest'
  ): string {
    const obj = { type: 'workflow', uuid: uuid };
    if (version) obj['version'] = version;
    return JSON.stringify(obj);
  }

  private workflowFromCacheGroup(
    groupName: string
  ): { uuid: string; version: string } {
    return JSON.parse(groupName);
  }

  public startSync() {
    this.cachedHttpClient.startSync();
  }

  public async refreshWorkflow(uuid: string, version: string) {
    await this.cachedHttpClient.refreshCacheEntriesGroup(
      {
        type: 'workflow',
        uuid: uuid,
      },
      false
    );
    await this.cachedHttpClient.refreshCacheEntriesGroup(
      {
        type: 'workflow',
        uuid: uuid,
        version: version,
      },
      false
    );
  }

  public async refreshListOfWorkflows() {
    await this.cachedHttpClient.refreshCacheEntriesByKeys([
      'registeredWorkflows',
      'subscribedWorkflows',
      // 'userScopedWorkflows',
    ]);
  }

  public onAuthorizationError = (error: FetchError) => {
    this.logger.error('Detected Authorization error', error);
  };

  public onError = (error: FetchError, response?: Response) => {
    this.logger.error('Detected error', error, response);
  };

  private doGet<T>(
    path: string,
    options: {
      http_options?: object;
      base_path?: string;
      useCache?: boolean;
      cacheKey?: string;
      cacheMeta?: object;
      cacheEntry?: string;
      cacheGroup?: string;
      cacheTTL?: number;
      cacheNotifyUpdates?: boolean;
    } = {
      http_options: this.get_http_options(),
      base_path: null,
      useCache: true,
      cacheNotifyUpdates: false,
    }
  ): Observable<T> {
    const base_path = options.base_path ?? this.apiBaseUrl;
    const httpOptions = options.http_options ?? this.get_http_options();
    const url: string = `${base_path}${path}`;
    return this.cachedHttpClient
      .get<T>(url, {
        ...httpOptions,
        cacheEntry: options.cacheEntry,
        cacheGroup: options.cacheGroup,
        cacheTTL: options.cacheTTL,
      })
      .pipe(
        retry(MAX_RETRIES),
        catchError((error: FetchError) => this.handleError('doGet', error))
      );
  }

  async logout(redirect: boolean = true): Promise<boolean> {
    const logged = await this.authService.checkIsUserLogged();
    if (logged) {
      return this.authService.logout(false).then(async () => {
        await this.cachedHttpClient.deleteCacheEntriesByKeys([
          'userProfile',
          'userSubscriptions',
          'subscribedWorkflows',
          'userScopedWorkflows',
          'userNotifications',
          'registeredWorkflows',
        ]);
        if (redirect) document.location.href = '/api/account/logout';
        return true;
      });
    }
    return false;
  }

  get_current_user(): Observable<User> {
    this.logger.debug('Getting current user', this.authService.isUserLogged());
    return of(this.authService.getCurrentUser());
  }

  get_current_user_notifications(): Observable<Array<UserNotification>> {
    return (
      this.doGet('/users/current/notifications', {
        cacheEntry: 'userNotifications',
        cacheTTL: 10,
      })
        // this.http
        //   .get(
        //     this.apiBaseUrl + '/users/current/notifications',
        //     this.get_http_options()
        //   )
        .pipe(
          retry(MAX_RETRIES),
          map((data) => {
            let result = [];
            for (let d of data['items']) {
              result.push(new UserNotification(d));
            }
            return result;
          })
        )
    );
  }

  setNotificationsReadingTime(
    notifications: UserNotification[]
  ): Observable<UserNotification[]> {
    let readTime = Date.now();
    let body = {
      items: notifications.map(function (n) {
        return {
          uuid: n['uuid'],
          read: String(readTime),
        };
      }),
    };
    return this.http
      .put(
        this.apiBaseUrl + '/users/current/notifications',
        body,
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        map(() => {
          for (let n of notifications) {
            n.read = readTime;
          }
          this.cachedHttpClient.deleteCacheEntryByKey('userNotifications');
          this.logger.debug('Notifications updated');
          return notifications;
        }),
        tap(() => {
          this.logger.debug('Notifications updated');
        }),
        catchError((error) => this.handleError('Updating notifications', error))
      );
  }

  deleteNotification(notification: UserNotification): Observable<object> {
    return this.http
      .delete(
        this.apiBaseUrl + '/users/current/notifications/' + notification.uuid,
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        tap(() => {
          this.cachedHttpClient.deleteCacheEntryByKey('userNotifications');
          this.logger.debug('Notification deleted');
        }),
        catchError((error) => this.handleError('Deleting notification', error))
      );
  }

  deleteNotifications(notifications: UserNotification[]): Observable<object> {
    let body = notifications.map(function (n) {
      return n['uuid'];
    });
    return this.http
      .patch(
        this.apiBaseUrl + '/users/current/notifications',
        body,
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        tap(() => {
          this.cachedHttpClient.deleteCacheEntryByKey('userNotifications');
          this.logger.debug('Notifications deleted');
        }),
        catchError((error) => this.handleError('Deleting notifications', error))
      );
  }

  getRegistries(): Observable<object> {
    return (
      this.doGet('/registries', {
        cacheEntry: 'registries',
        cacheTTL: 60 * 1000,
      })
        // return this.http
        //   .get(this.apiBaseUrl + '/registries', this.get_http_options())
        .pipe(
          retry(MAX_RETRIES),
          map((data) => {
            this.logger.debug('Data registries', data);
            let result = [];
            for (let r of data['items']) {
              result.push(new Registry(r));
            }
            return result;
          })
        )
    );
  }

  getRegistryWorkflows(registry_uuid: string): Observable<object> {
    return (
      this.doGet('/registries/' + registry_uuid + '/index', {
        cacheEntry: 'registryWorkflows',
        cacheTTL: 60 * 1000,
      })
        // return this.http
        //   .get(
        //     this.apiBaseUrl + '/registries/' + registry_uuid + '/index',
        //     this.get_http_options()
        //   )
        .pipe(
          retry(MAX_RETRIES),
          map((data) => {
            this.logger.debug('Data registries', data);
            let result = [];
            for (let w of data['items']) {
              result.push(new RegistryWorkflow(w));
            }
            return result;
          })
        )
    );
  }

  getRegistryWorkflow(
    registry_uuid: string,
    workflow_identifier: string
  ): Observable<RegistryWorkflow> {
    return (
      this.doGet(
        '/registries/' + registry_uuid + '/index/' + workflow_identifier,
        {
          cacheTTL: 60 * 1000,
        }
      )
        // return this.http
        //   .get(
        //     this.apiBaseUrl +
        //       '/registries/' +
        //       registry_uuid +
        //       '/index/' +
        //       workflow_identifier,
        //     this.get_http_options()
        //   )
        .pipe(
          retry(MAX_RETRIES),
          map((data) => {
            this.logger.debug('Data registries', data);
            return new RegistryWorkflow(data);
          })
        )
    );
  }

  updateWorkflowName(
    workflow: Workflow
  ): Observable<{ meta: { modified: number } }> {
    let body = {
      name: workflow.name,
    };
    return this.http
      .put(
        this.apiBaseUrl + '/workflows/' + workflow.uuid,
        body,
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        map((data: { meta: { modified: number } }) => {
          this.refreshWorkflow(
            workflow.uuid,
            workflow.currentVersion.version['version']
          ).then(() => {
            this.logger.debug('Changed workflow name to:' + workflow.name);
          });
          workflow.currentVersion.modified = data.meta.modified;
          return data;
        }),
        tap((data) => {
          this.logger.debug('Check workflowVersion', workflow);
          this.logger.debug('Workflow name changed to: ', data);
        })
      );
  }

  changeWorkflowVisibility(workflow: WorkflowVersion): Observable<any> {
    let body = {
      public: !workflow.public,
    };
    return this.http
      .put(
        this.apiBaseUrl + '/workflows/' + workflow.uuid,
        body,
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        map((data) => {
          workflow.public = !workflow.public;
          this.refreshWorkflow(workflow.uuid, workflow.version['version']).then(
            () => {
              this.refreshListOfWorkflows().then(() => {
                this.logger.debug('Changed workflow name to:' + workflow.name);
              });
            }
          );

          this.logger.debug(
            'Changed workflow visibility: public=' + workflow.public
          );
        }),
        tap((data) => {
          this.logger.debug('Workflow visibility changed to: ', data);
        })
      );
  }

  registerRegistryWorkflow(
    workflow: RegistryWorkflow,
    version: string = null,
    name: string = null,
    is_public: boolean = false
  ): Observable<object> {
    let data = {
      identifier: workflow.identifier,
      name: name,
      version: version,
      public: is_public,
      uuid: uuidv4(),
      async: true,
    };
    return this.http
      .post(
        this.apiBaseUrl +
          '/registries/' +
          workflow.registry.uuid +
          '/workflows',
        data,
        this.get_http_options()
      )
      .pipe(
        map((wf_data) => {
          this.logger.debug('Workflow registered', wf_data);
          // this.refreshListOfWorkflows().then(() => {});
          return wf_data;
        })
      );
  }

  registerWorkflowRoCrate(
    uuid: string,
    version: string,
    url: string = null,
    rocrate: string = null,
    name: string = null,
    is_public: boolean = false,
    authorization: string = null
  ): Observable<object> {
    let data = {
      uuid: uuid,
      version: version,
      async: true,
    };
    if (url && rocrate) {
      throw Error('Only one of [url,rocrate] can be specified');
    }
    if (url) data['roc_link'] = url;
    if (rocrate) data['rocrate'] = rocrate;
    if (name) data['name'] = name;
    if (is_public) data['public'] = is_public;
    if (authorization) data['authorization'] = authorization;
    return this.http
      .post(
        this.apiBaseUrl + '/users/current/workflows',
        data,
        this.get_http_options()
      )
      .pipe(
        map((wf_data) => {
          this.logger.debug('Workflow registered', wf_data);
          // this.refreshListOfWorkflows().then(() => {});
          return wf_data;
          // return from(
          //   this.refreshListOfWorkflows().then(() => {
          //     setTimeout(() => {
          //       this.workflowVersionCreated.next({
          //         uuid: wf_data['uuid'],
          //         version: wf_data['version'],
          //       });
          //     }, 1000);
          //     return wf_data;
          //   })
          // );
        })
      );
  }

  deleteWorkflowVersion(
    uuid: string,
    version: string
  ): Observable<{ uuid: string; version: string }> {
    return this.http
      .delete(
        this.apiBaseUrl + '/workflows/' + uuid + '/versions/' + version,
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        map(() => {
          this.logger.debug('Workflow deleted');
          this.refreshListOfWorkflows().then(() => {});
          return { uuid: uuid, version: version };
        })
      );
  }

  deleteWorkflow(uuid: string): Observable<{ uuid: string }> {
    return this.http
      .delete(this.apiBaseUrl + '/workflows/' + uuid, this.get_http_options())
      .pipe(
        retry(MAX_RETRIES),
        map(() => {
          this.logger.debug('Workflow deleted');
          this.refreshListOfWorkflows().then(() => {});
          return { uuid: uuid };
        })
      );
  }

  downloadROCrate(workflow: WorkflowVersion): Observable<any> {
    let token = JSON.parse(localStorage.getItem('token'));
    let headers = new HttpHeaders();
    if (token) {
      headers.append['Authorization'] = 'Bearer ' + token['token']['value'];
    }
    return this.http
      .get(workflow.downloadLink, {
        headers: headers,
        responseType: 'blob',
      })
      .pipe(
        retry(MAX_RETRIES),
        tap((data) => this.logger.debug('RO-Create downloaded')),
        catchError((error) => this.handleError('download RO-Crate', error))
      );
  }

  subscribeWorkflow(workflow: WorkflowVersion): Observable<WorkflowVersion> {
    return this.http
      .post(
        this.apiBaseUrl + '/workflows/' + workflow.uuid + '/subscribe',
        {},
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        map((subscription) => {
          this.logger.debug('Created new subscription', subscription);
          if (subscription) {
            workflow.subscriptions.push(subscription);
          }
          return workflow;
        }),
        tap((data) => {
          this.refreshListOfWorkflows().then(() => {
            this.logger.debug('Invalidated cache of workflows list');
          });
          this.logger.debug('Workflow visibility changed to: ', data);
        })
      );
  }

  unsubscribeWorkflow(workflow: WorkflowVersion): Observable<WorkflowVersion> {
    return this.http
      .post(
        this.apiBaseUrl + '/workflows/' + workflow.uuid + '/unsubscribe',
        {},
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        map(() => {
          this.logger.debug('Subscription to workflow deleted');
          for (let i = 0; i < workflow.subscriptions.length; i++) {
            let s = workflow.subscriptions[i];
            if (s['resource']['uuid'] === workflow.uuid) {
              workflow.subscriptions.splice(i, 1);
            }
          }
          return workflow;
        }),
        tap((data) => {
          this.refreshListOfWorkflows().then(() => {
            this.logger.debug('Invalidated cache of workflows list');
          });
          this.logger.debug('Workflow visibility changed to: ', data);
        })
      );
  }

  get_workflows(
    filteredByUser: boolean = false,
    includeSubScriptions: boolean = false,
    status: boolean = false,
    versions: boolean = true,
    useCache: boolean = true
  ): Observable<object> {
    this.logger.debug(
      'Loading workflows params',
      filteredByUser,
      includeSubScriptions
    );
    this.logger.debug('Getting workflows', useCache);
    const cacheKey: string =
      filteredByUser && includeSubScriptions
        ? 'subscribedWorkflows'
        : !filteredByUser && includeSubScriptions
        ? 'userScopedWorkflows'
        : 'registeredWorkflows';
    this.logger.debug('Getting workflows', useCache, cacheKey);
    const url: string = !filteredByUser
      ? `/workflows?status=${status}&versions=${versions}&subscriptions=${includeSubScriptions}`
      : `/users/current/workflows?status=${status}&versions=${versions}&subscriptions=${includeSubScriptions}`;
    this.logger.debug('Getting workflows URL: ', url);
    return this.doGet<object>(url, {
      useCache: useCache,
      cacheKey: cacheKey,
      cacheEntry: cacheKey,
      cacheTTL: 10,
    }).pipe(
      mergeMap(
        (data: {
          items: Array<{
            uuid: string;
            subscriptions: Array<{ resource: { uuid: string } }>;
          }>;
        }) => {
          if (cacheKey === 'userScopedWorkflows') {
            return this.doGet<object>('/users/current/subscriptions', {
              useCache: useCache,
              cacheKey: 'userSubscriptions',
              cacheEntry: 'userSubscriptions',
              cacheTTL: 10,
            }).pipe(
              map(
                (subscriptions: {
                  items: Array<{ resource: { uuid: string } }>;
                }) => {
                  data.items = data.items.map((w) => {
                    if (!w.subscriptions) w.subscriptions = [];
                    return w;
                  });
                  if (subscriptions && subscriptions.items) {
                    for (const sub of subscriptions.items) {
                      const wf = data['items'].find(
                        (w: any) => w.uuid === sub.resource.uuid
                      );
                      if (wf) {
                        wf.subscriptions.push(sub);
                      }
                    }
                  }
                  return data;
                }
              )
            );
          }

          return of(data);
        }
      ),
      retry(MAX_RETRIES),
      tap((data) => {
        this.logger.debug('Loaded workflows TAP: ', data);
      }),
      catchError((error) => this.handleError('get_workflows', error))
    );
  }

  get_workflow(uuid: string): Observable<Workflow> {
    this.logger.debug(`Getting workflow ${uuid}`);
    // const workflow_query = this.http.get<WorkflowVersion>(
    //   this.apiBaseUrl + '/workflows/' + uuid,
    //   this.get_http_options({
    //     ro_crate: false,
    //   })
    // );
    const workflow_query = this.doGet<WorkflowVersion>(`/workflows/${uuid}`, {
      http_options: this.get_http_options({
        ro_crate: false,
      }),
      cacheMeta: { uuid: uuid },
      cacheGroup: this.workflowToCacheGroup(uuid),
    });

    // const workflow_versions_query = this.http.get<WorkflowVersion>(
    //   this.apiBaseUrl + '/workflows/' + uuid + '/versions',
    //   this.get_http_options({})
    // );
    const workflow_versions_query = this.doGet<WorkflowVersion>(
      `/workflows/${uuid}/versions`,
      {
        cacheMeta: { uuid: uuid },
        cacheEntry: `${uuid}-versions`,
        cacheGroup: this.workflowToCacheGroup(uuid),
      }
    );

    const queries = [workflow_query, workflow_versions_query];

    return forkJoin(queries).pipe(
      map((result) => {
        let workflow: Workflow = new Workflow(result[0]);
        workflow.updateDescriptors(result[1]['versions']);
        this.logger.debug('Loaded workflow', workflow);
        return workflow;
      }),
      tap((result) => this.logger.debug('Loaded workflow: ', result)),
      retry(MAX_RETRIES)
    );
  }

  get_workflow_version(
    uuid: string,
    version: string = 'latest',
    options: {
      previous_versions: boolean;
      ro_crate: boolean;
      load_suites: boolean;
      load_status: boolean;
      use_cache?: boolean;
    } = {
      previous_versions: false,
      ro_crate: false,
      load_suites: true,
      load_status: true,
      use_cache: true,
    }
  ): Observable<WorkflowVersion> {
    this.logger.debug('Request login');
    const workflow = this.doGet<WorkflowVersion>(
      `/workflows/${uuid}/versions/${version}`,
      {
        http_options: this.get_http_options({
          // TODO: remove previoius versions
          previous_versions: options.previous_versions,
          ro_crate: options.ro_crate ?? true,
        }),
        cacheMeta: { uuid: uuid, version: version },
        useCache: options.use_cache ?? true,
        cacheGroup: this.workflowToCacheGroup(uuid, version),
      }
    );

    let queries: Array<object> = [workflow];
    if (options.load_status) {
      const status = this.doGet<Status>(
        `/workflows/${uuid}/status?version=${version}`,
        {
          cacheMeta: { uuid: uuid, version: version },
          useCache: options.use_cache ?? true,
          cacheGroup: this.workflowToCacheGroup(uuid, version),
        }
      ).pipe(
        retry(MAX_RETRIES),
        catchError((err) => {
          this.logger.debug('workflow status error', err);
          return throwError(err);
        })
      );
      queries.push(status);
    }

    let w = new WorkflowVersion({ uuid: uuid });
    let suites = null;
    if (options.load_suites) {
      suites = this.get_suites(w, version);
      if (suites) queries.push(suites);
    }

    return forkJoin(queries).pipe(
      map((result) => {
        w.update(result[0]);
        if (options.load_status) w.status = result[1];
        this.logger.debug('The complete workflow version SUITEs', result[2]);
        w.suites = new AggregatedStatusStats(
          options.load_status && options.load_suites
            ? result[2]
            : options.load_suites
            ? result[1]
            : []
        );
        this.logger.debug('The complete workflow version', w);
        return w;
      }),
      tap((result) => this.logger.debug('Loaded workflow: ', result)),
      retry(MAX_RETRIES)
    );
  }

  loadSuite(suiteData: Object): Observable<Suite> {
    return this.doGet<Status>('/suites/' + suiteData['uuid'] + '/status').pipe(
      retry(MAX_RETRIES),
      mergeMap((status: Object) => {
        let suite: Suite = new Suite({} as WorkflowVersion, suiteData);
        suite.status = new Status({
          aggregate_test_status: status['status'],
        });
        suite.latestBuilds = status['latest_builds'];
        suite.instances = new InstanceStats();

        let instanceBuildsQueries = [];
        for (let instanceData of suiteData['instances']) {
          instanceBuildsQueries.push(
            this.doGet(`/instances/${instanceData['uuid']}/latest-builds`, {
              cacheMeta: {},
            }).pipe(
              retry(MAX_RETRIES),
              map((instaceLatestBuildsData) => {
                this.logger.debug(
                  'Latest builds result',
                  instaceLatestBuildsData,
                  suite,
                  instanceData
                );
                this.logger.debug('Instance Data', instanceData);
                let instance = new TestInstance(suite, instanceData);
                instance.latestBuilds = instaceLatestBuildsData['items'].map(
                  (x: object) => {
                    return new TestBuild(instance, x);
                  }
                );
                suite.instances.add(instance);
                return instance;
              }),
              tap((result) => {
                this.logger.debug('Loaded latest test instance builds', result);
              })
            )
          );
        }

        return forkJoin(instanceBuildsQueries).pipe(
          retry(MAX_RETRIES),
          map((instanceLatestBuilds) => {
            return suite;
          }),
          catchError((err) => {
            this.logger.debug('Catching error of latest builds of instance');
            return [];
          })
        );
      })
    );
  }

  get_suites(
    workflow: WorkflowVersion,
    version: string = 'latest',
    useCache: boolean = true
  ): Observable<Suite[]> {
    this.logger.debug('Loading suites of workflow ....', workflow);
    return this.doGet<Suite[]>(
      `/workflows/${workflow.uuid}/suites?version=${version}&status=true&latest_builds=false`,
      {
        cacheMeta: { uuid: workflow.uuid, version: version },
        useCache: useCache,
        cacheGroup: this.workflowToCacheGroup(workflow.uuid, version),
      }
    ).pipe(
      retry(MAX_RETRIES),
      map((rawSuitesData: any) => {
        const items = rawSuitesData?.items ?? [];
        return items.map((data: any) => {
          const suite = { ...data };
          if ('aggregate_test_status' in suite)
            suite['status'] = suite['aggregate_test_status'];
          return suite;
        });
      }),
      mergeMap((rawSuitesData: []) => {
        let dataIndexMap: { [key: string]: number } = {};
        let queries = [];
        for (let suite of rawSuitesData) {
          let instances: Array<any> = suite['instances'];
          for (let instanceData of instances) {
            dataIndexMap[instanceData['uuid']] = queries.length;
            queries.push(
              this.doGet(
                '/instances/' + instanceData['uuid'] + '/latest-builds',
                {
                  cacheMeta: { uuid: workflow.uuid, version: version },
                  useCache: useCache,
                  cacheGroup: this.workflowToCacheGroup(workflow.uuid, version),
                }
              )
            );
          }
        }

        if (!queries || queries.length == 0) return of([]);
        return forkJoin(queries).pipe(
          retry(MAX_RETRIES),
          catchError((error) => {
            let suites: Array<Suite> = [];
            for (let suiteData of rawSuitesData) {
              let data: {} = suiteData;
              data['status'] = 'unavailable';
              let suite: Suite = new Suite(workflow, suiteData);
              suite.instances = new InstanceStats();

              let listOfinstances: Array<any> = suiteData['instances'];
              for (let instanceData of listOfinstances) {
                let instance = new TestInstance(suite, instanceData);
                instance.status = 'unavailable';
                instance.latestBuilds = [];
                suite.instances.add(instance);
              }
              suites.push(suite);
            }
            return [suites];
          }),
          mergeMap((statuses) => {
            this.logger.debug(
              'Suite statuses after forkjoin',
              statuses,
              rawSuitesData
            );

            let suites: Array<Suite> = [];
            for (let suiteData of rawSuitesData) {
              let suite: Suite = new Suite(workflow, suiteData);
              suite.status = new Status({
                aggregate_test_status: suiteData['status'],
              });
              suite.latestBuilds = suiteData['latest_builds'];
              suite.instances = new InstanceStats();

              let listOfinstances: Array<any> = suiteData['instances'];
              for (let instanceData of listOfinstances) {
                let instaceLatestBuildsData =
                  statuses[dataIndexMap[instanceData['uuid']]];
                let instance = new TestInstance(suite, instanceData);
                try {
                  instance.latestBuilds = instaceLatestBuildsData['items']?.map(
                    (x: object) => new TestBuild(instance, x)
                  );
                } catch (e) {
                  this.logger.warn('Unable to load last builds');
                } finally {
                  suite.instances.add(instance);
                }
              }
              suites.push(suite);
            }

            return from([suites]);
          })
        );
      })
    );
  }

  getSuite(uuid: string): Observable<Suite> {
    return this.doGet(`/suites/${uuid}`).pipe(
      retry(MAX_RETRIES),
      mergeMap((data) => {
        //let s = new Suite({} as Workflow, data);
        this.logger.debug('Suite data:', data);
        //return of(new Suite({} as Workflow, data));
        return this.loadSuite(data).pipe(
          map((suite: Suite) => {
            return suite;
          })
        );
      }),
      tap((result) => {
        this.logger.debug('Loaded suite', result);
      })
    );
  }

  updateSuite(suite: Suite): Observable<any> {
    let body = {
      name: suite.name,
    };
    return this.http
      .put(
        this.apiBaseUrl + '/suites/' + suite.uuid,
        body,
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        map((data) => {
          this.logger.debug('Changed suite name to:' + suite.name);
        }),
        tap((data) => {
          this.logger.debug('Suite name changed to: ', data);
          this.refreshListOfWorkflows().then(() => {
            this.logger.debug('Invalidated cache of workflows list');
          });
        })
      );
  }

  updateTestInstance(instance: TestInstance): Observable<any> {
    let body = {
      name: instance.name,
    };
    return this.http
      .put(
        this.apiBaseUrl + '/instances/' + instance.uuid,
        body,
        this.get_http_options()
      )
      .pipe(
        retry(MAX_RETRIES),
        map((data) => {
          this.logger.debug('Changed instance name to:' + instance.name);
        }),
        tap((data) => this.logger.debug('TestInstance name changed to: ', data))
      );
  }

  getLatestTestInstance(uuid: string): Observable<any> {
    return this.doGet(`/suites/${uuid}/instances`).pipe(
      retry(MAX_RETRIES),
      map((data) => {
        return data['items'];
      }),
      tap((result) => {
        this.logger.debug('Loaded suite test instances', result);
      })
    );
  }

  getLatestTestInstanceBuilds(uuid: string): Observable<any> {
    return this.doGet(`/instances/${uuid}/latest-builds`).pipe(
      retry(MAX_RETRIES),
      map((data) => {
        return data['items'];
      }),
      tap((result) => {
        this.logger.debug('Loaded latest test instance builds', result);
      })
    );
  }

  getBuildLogs(testInstanceUUID: string, buildID: string): Observable<any> {
    return this.doGet(
      `/instances/${testInstanceUUID}/builds/${buildID}/logs`
    ).pipe(
      retry(MAX_RETRIES),
      map((data) => {
        return data;
      }),
      tap((result) => {
        this.logger.debug(
          'Loaded logs of test instance build',
          buildID,
          result
        );
      })
    );
  }

  public checkROCrateAvailability(
    workflow: WorkflowVersion
  ): Observable<boolean> {
    return this.http
      .head(workflow.downloadLink, this.get_http_options({}, true))
      .pipe(
        map((result) => {
          this.logger.debug('Result: ', result);
          return true;
        }),
        catchError((err) => {
          this.logger.error('Error', err);
          return of(false);
        })
      );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError(operation = 'operation', error: any) {
    // TODO: send the error to remote logging infrastructure
    this.logger.error(error); // log to console instead

    // TODO: better job of transforming error for user consumption
    this.logger.debug(`${operation} failed: ${error.message}`);

    if (error.status === 401 && error.statusText === 'UNAUTHORIZED') {
      if (this.onAuthorizationError) this.onAuthorizationError(error);
    } else if (this.onError) this.onError(error, error?.response);

    // Let the app keep running by returning an empty result.
    return throwError(error);
  }
}
