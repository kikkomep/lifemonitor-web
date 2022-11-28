import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, retry, tap } from 'rxjs/operators';
import { UserNotification } from 'src/app/models/notification.model';
import { Registry, RegistryWorkflow } from 'src/app/models/registry.models';
import {
  AggregatedStatusStats,
  InstanceStats,
  Status
} from 'src/app/models/stats.model';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { User } from 'src/app/models/user.modes';
import { Workflow, WorkflowVersion } from 'src/app/models/workflow.model';
import { v4 as uuidv4 } from 'uuid';
import { Logger, LoggerManager } from '../logging';
import { AppConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiBaseUrl: string = null;
  private httpOptions: object = null;

  // initialize logger
  private logger: Logger = LoggerManager.create('ApiService');

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.apiBaseUrl = this.config.getConfig()['apiBaseUrl'];
    this.logger.debug('API Service created');
  }

  private get_http_options(params = {}, skip: boolean = false) {
    let token = JSON.parse(localStorage.getItem('token'));
    let http_headers = {
      // 'Content-Type':  'application/json',
      skip: String(skip),
    };
    if (token) {
      http_headers['Authorization'] = 'Bearer ' + token['token']['value'];
    }
    let http_options = {
      headers: new HttpHeaders(http_headers),
      params: params,
    };
    return http_options;
  }

  get_current_user(): Observable<User> {
    return this.http
      .get(this.apiBaseUrl + '/users/current', this.get_http_options())
      .pipe(
        retry(3),
        map((data) => {
          return new User(data);
        })
      );
  }

  get_current_user_notifications(): Observable<Array<UserNotification>> {
    return this.http
      .get(this.apiBaseUrl + '/users/current/notifications', this.get_http_options())
      .pipe(
        retry(3),
        map((data) => {
          let result = [];
          for (let d of data['items']) {
            result.push(new UserNotification(d))
          }
          return result;
        })
      );
  }

  setNotificationsReadingTime(notifications: UserNotification[]): Observable<UserNotification[]> {
    let readTime = Date.now();
    let body = {
      'items': notifications.map(function (n) {
        return {
          uuid: n['uuid'],
          read: String(readTime)
        }
      })
    };
    return this.http
      .put(
        this.apiBaseUrl + '/users/current/notifications',
        body,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map(() => {
          for (let n of notifications) {
            n.read = readTime;
          }
          this.logger.debug('Notifications updated');
          return notifications;
        }),
        tap(() => {
          this.logger.debug('Notifications updated');
        }),
        catchError(this.handleError('Updating notifications', []))
      );
  }

  deleteNotification(notification: UserNotification): Observable<object> {
    return this.http
      .delete(
        this.apiBaseUrl + '/users/current/notifications/' + notification.uuid,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        tap(() => {
          this.logger.debug('Notification deleted');
        }),
        catchError(this.handleError('Deleting notification', []))
      );
  }

  deleteNotifications(notifications: UserNotification[]): Observable<object> {
    let body = notifications.map(function (n) { return n['uuid']; });
    return this.http
      .patch(
        this.apiBaseUrl + '/users/current/notifications',
        body,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        tap(() => {
          this.logger.debug('Notifications deleted');
        }),
        catchError(this.handleError('Deleting notifications', []))
      );
  }

  getRegistries(): Observable<object> {
    return this.http
      .get(this.apiBaseUrl + '/registries', this.get_http_options())
      .pipe(
        retry(3),
        map((data) => {
          this.logger.debug('Data registries', data);
          let result = [];
          for (let r of data['items']) {
            result.push(new Registry(r));
          }
          return result;
        })
      );
  }

  getRegistryWorkflows(registry_uuid: string): Observable<object> {
    return this.http
      .get(
        this.apiBaseUrl + '/registries/' + registry_uuid + '/index',
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((data) => {
          this.logger.debug('Data registries', data);
          let result = [];
          for (let w of data['items']) {
            result.push(new RegistryWorkflow(w));
          }
          return result;
        })
      );
  }

  getRegistryWorkflow(registry_uuid: string, workflow_identifier: string): Observable<RegistryWorkflow> {
    return this.http
      .get(
        this.apiBaseUrl + '/registries/' + registry_uuid + '/index/' + workflow_identifier,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((data) => {
          this.logger.debug('Data registries', data);
          return new RegistryWorkflow(data);
        })
      );
  }

  updateWorkflowName(workflow: WorkflowVersion): Observable<any> {
    let body = {
      name: workflow.name
    };
    return this.http
      .put(
        this.apiBaseUrl + '/workflows/' + workflow.uuid,
        body,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((data) => {
          workflow.public = !workflow.public;
          this.logger.debug('Changed workflow name to:' + workflow.name);
        }),
        tap((data) => this.logger.debug('Workflow name changed to: ', data)),
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
        retry(3),
        map((data) => {
          workflow.public = !workflow.public;
          this.logger.debug('Changed workflow visibility: public=' + workflow.public);
        }),
        tap((data) => this.logger.debug('Workflow visibility changed to: ', data)),
      );
  }

  registerRegistryWorkflow(
    workflow: RegistryWorkflow,
    version: string = null,
    name: string = null,
    is_public: boolean = false): Observable<object> {
    let data = {
      "identifier": workflow.identifier,
      "name": name,
      "version": version,
      "public": is_public,
      "uuid": uuidv4()
    }
    return this.http
      .post(
        this.apiBaseUrl + '/registries/' + workflow.registry.uuid + '/workflows',
        data,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((wf_data) => {
          this.logger.debug('Workflow registered', wf_data);
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
        retry(3),
        map((wf_data) => {
          this.logger.debug('Workflow registered', wf_data);
          return wf_data;
        })
      );
  }

  deleteWorkflowVersion(uuid: string, version: string):
    Observable<{ uuid: string; version: string }> {
    return this.http
      .delete(
        this.apiBaseUrl + '/workflows/' + uuid + '/versions/' + version,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map(() => {
          this.logger.debug('Workflow deleted');
          return { uuid: uuid, version: version };
        })
      );
  }

  deleteWorkflow(uuid: string):
    Observable<{ uuid: string; }> {
    return this.http
      .delete(
        this.apiBaseUrl + '/workflows/' + uuid,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map(() => {
          this.logger.debug('Workflow deleted');
          return { uuid: uuid };
        })
      );
  }


  downloadROCrate(workflow: WorkflowVersion): Observable<any> {
    let token = JSON.parse(localStorage.getItem('token'));
    let headers = new HttpHeaders();
    if (token) {
      headers.append["Authorization"] = 'Bearer ' + token['token']['value'];
    }
    return this.http
      .get(workflow.downloadLink, {
        headers: headers,
        responseType: 'blob',
      })
      .pipe(
        retry(3),
        tap((data) => this.logger.debug('RO-Create downloaded')),
        catchError(this.handleError('download RO-Crate', []))
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
        retry(3),
        map((subscription) => {
          this.logger.debug('Created new subscription', subscription);
          if (subscription) {
            workflow.subscriptions.push(subscription);
          }
          return workflow;
        }),
        tap((data) => this.logger.debug('Workflow visibility changed to: ', data))
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
        retry(3),
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
        tap((data) => this.logger.debug('Workflow visibility changed to: ', data))
      );
  }

  get_workflows(
    filteredByUser: boolean = false,
    includeSubScriptions: boolean = false,
    status: boolean = true,
    versions: boolean = true
  ): Observable<object> {
    this.logger.debug(
      'Loading workflows params',
      filteredByUser,
      includeSubScriptions
    );
    let url: string = !filteredByUser
      ? this.apiBaseUrl + `/workflows?status=${status}&versions=${versions}`
      : this.apiBaseUrl +
      `/users/current/workflows?status=${status}&versions=${versions}&subscriptions=${includeSubScriptions}`;
    return this.http.get(url, this.get_http_options()).pipe(
      retry(3),
      tap((data) => this.logger.debug('Loaded workflows: ', data)),
      catchError(this.handleError('get_workflows', []))
    );
  }

  get_workflow(uuid: string): Observable<Workflow> {
    this.logger.debug('Request login');
    const workflow_query = this.http.get<WorkflowVersion>(
      this.apiBaseUrl + '/workflows/' + uuid,
      this.get_http_options({
        ro_crate: false,
      })
    );

    const workflow_versions_query = this.http.get<WorkflowVersion>(
      this.apiBaseUrl + '/workflows/' + uuid + '/versions',
      this.get_http_options({})
    );

    const queries = [workflow_query, workflow_versions_query];

    return forkJoin(queries).pipe(
      map((result) => {
        let workflow: Workflow = new Workflow(result[0]);
        workflow.updateDescriptors(result[1]["versions"]);
        this.logger.debug('Loaded workflow', workflow);
        return workflow;
      }),
      tap((result) => this.logger.debug('Loaded workflow: ', result)),
      retry(3)
    );
  }

  get_workflow_version(
    uuid: string,
    version: string = "latest",
    previous_versions = false,
    ro_crate = false,
    load_suites = true,
    load_status = true
  ): Observable<WorkflowVersion> {
    this.logger.debug('Request login');
    const workflow = this.http.get<WorkflowVersion>(
      this.apiBaseUrl + '/workflows/' + uuid + '/versions/' + version,
      this.get_http_options({
        // TODO: remove previoius versions
        previous_versions: previous_versions,
        ro_crate: ro_crate,
      })
    );

    let queries: Array<object> = [workflow];

    if (load_status) {
      const status = this.http
        .get<Status>(
          this.apiBaseUrl + '/workflows/' + uuid + '/status?version=' + version,
          this.get_http_options()
        )
        .pipe(
          retry(3),
          catchError((err) => {
            this.logger.debug('workflow status error', err);
            return throwError(err);
          })
        );
      queries.push(status);
    }

    let w = new WorkflowVersion({ uuid: uuid });
    let suites = null;
    if (load_suites) {
      suites = this.get_suites(w, version);
      if (suites) queries.push(suites);
    }

    return forkJoin(queries).pipe(
      map((result) => {
        w.update(result[0]);
        if (load_status)
          w.status = result[1];
        w.suites = new AggregatedStatusStats(load_status && load_suites ? result[2] : (load_suites ? result[1] : []));
        this.logger.debug('workflow', w);
        return w;
      }),
      tap((result) => this.logger.debug('Loaded workflow: ', result)),
      retry(3)
    );
  }

  get_suites_parallel(uuid: string): Observable<Suite[]> {
    this.logger.debug('Loading suites....');
    return this.http
      .get<Suite[]>(
        this.apiBaseUrl + '/workflows/' + uuid + '/suites',
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((rawSuitesData) => {
          let suites: Suite[] = [];
          for (let suiteData of rawSuitesData['items']) {
            this.loadSuite(suiteData).subscribe((suite: Suite) => {
              suites.push(suite);
            });
          }
          return suites;
        })
      );
  }

  loadSuite(suiteData: Object): Observable<Suite> {
    return this.http
      .get<Status>(
        this.apiBaseUrl + '/suites/' + suiteData['uuid'] + '/status',
        this.get_http_options()
      )
      .pipe(
        retry(3),
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
              this.http
                .get(
                  this.apiBaseUrl +
                  '/instances/' +
                  instanceData['uuid'] +
                  '/latest-builds',
                  this.get_http_options()
                )
                .pipe(
                  retry(3),
                  map((instaceLatestBuildsData) => {
                    this.logger.debug(
                      'Latest builds result',
                      instaceLatestBuildsData,
                      suite,
                      instanceData
                    );
                    this.logger.debug('Instance Data', instanceData);
                    let instance = new TestInstance(suite, instanceData);
                    instance.latestBuilds = instaceLatestBuildsData[
                      'items'
                    ].map((x: object) => {
                      return new TestBuild(instance, x);
                    });
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
            retry(3),
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

  get_suites(workflow: WorkflowVersion, version: string = "latest"): Observable<Suite[]> {
    this.logger.debug('Loading suites of workflow ....', workflow);
    return this.http
      .get<Suite[]>(
        `${this.apiBaseUrl}/workflows/${workflow.uuid}/suites?version=${version}&status=true&latest_builds=true`,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((rawSuitesData) => {
          return rawSuitesData['items'];
        }),
        mergeMap((rawSuitesData: []) => {
          this.logger.debug('Suites', rawSuitesData);

          let dataIndexMap: { [key: string]: number } = {};
          let queries = [];
          for (let suite of rawSuitesData) {

            let instances: Array<any> = suite['instances'];
            for (let instanceData of instances) {
              dataIndexMap[instanceData['uuid']] = queries.length;
              queries.push(
                this.http.get(
                  this.apiBaseUrl +
                  '/instances/' +
                  instanceData['uuid'] +
                  '/latest-builds',
                  this.get_http_options()
                )
              );
            }
          }

          if (!queries || queries.length == 0) return of([]);
          return forkJoin(queries).pipe(
            retry(3),
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
                    instance.latestBuilds = instaceLatestBuildsData[
                      'items'
                    ].map((x: object) => new TestBuild(instance, x));
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
    return this.http
      .get(this.apiBaseUrl + '/suites/' + uuid, this.get_http_options())
      .pipe(
        retry(3),
        mergeMap((data) => {
          //let s = new Suite({} as Workflow, data);
          this.logger.debug('Suite data:', data);
          //return of(new Suite({} as Workflow, data));
          return this.loadSuite(data).pipe(
            map((suite: Suite) => {
              return suite;
            })
          );
          //return s;
        }),
        tap((result) => {
          this.logger.debug('Loaded suite', result);
        })
      );
  }

  updateSuite(suite: Suite): Observable<any> {
    let body = {
      name: suite.name
    };
    return this.http
      .put(
        this.apiBaseUrl + '/suites/' + suite.uuid,
        body,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((data) => {
          this.logger.debug('Changed suite name to:' + suite.name);
        }),
        tap((data) => this.logger.debug('Suite name changed to: ', data))
      );
  }

  updateTestInstance(instance: TestInstance): Observable<any> {
    let body = {
      name: instance.name
    };
    return this.http
      .put(
        this.apiBaseUrl + '/instances/' + instance.uuid,
        body,
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((data) => {
          this.logger.debug('Changed instance name to:' + instance.name);
        }),
        tap((data) => this.logger.debug('TestInstance name changed to: ', data))
      );
  }


  getLatestTestInstance(uuid: string): Observable<any> {
    return this.http
      .get(
        this.apiBaseUrl + '/suites/' + uuid + '/instances',
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((data) => {
          return data['items'];
        }),
        tap((result) => {
          this.logger.debug('Loaded suite test instances', result);
        })
      );
  }

  getLatestTestInstanceBuilds(uuid: string): Observable<any> {
    return this.http
      .get(
        this.apiBaseUrl + '/instances/' + uuid + '/latest-builds',
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((data) => {
          return data['items'];
        }),
        tap((result) => {
          this.logger.debug('Loaded latest test instance builds', result);
        })
      );
  }

  getBuildLogs(testInstanceUUID: string, buildID: string): Observable<any> {
    return this.http
      .get(
        this.apiBaseUrl +
        '/instances/' +
        testInstanceUUID +
        '/builds/' +
        buildID +
        '/logs',
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((data) => {
          return data;
        }),
        tap((result) => {
          this.logger.debug('Loaded logs of test instance build', buildID, result);
        })
      );
  }

  public checkROCrateAvailability(workflow: WorkflowVersion): Observable<boolean> {
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
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO: send the error to remote logging infrastructure
      this.logger.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.logger.debug(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
