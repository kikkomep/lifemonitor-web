import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, map, mergeMap, retry, tap } from 'rxjs/operators';
import {
  AggregatedStatusStats,
  InstanceStats,
  Status
} from 'src/app/models/stats.model';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { User } from 'src/app/models/user.modes';
import { Workflow } from 'src/app/models/workflow.model';
import { AppConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiBaseUrl: string = null;
  private httpOptions: object = null;

  constructor(private http: HttpClient, private config: AppConfigService) {
    this.apiBaseUrl = this.config.getConfig()['apiBaseUrl'];
    console.log('API Service created');
    this.get_workflows().subscribe((data) => {
      console.log('Loaded workflows', data);
    });
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

  changeWorkflowVisibility(workflow: Workflow): Observable<any> {
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
          console.log('Changed workflow visibility: public=' + workflow.public);
        }),
        tap((data) => console.log('Workflow visibility changed to: ', data)),
        catchError(this.handleError('Updating workflow', []))
      );
  }

  downloadROCrate(workflow: Workflow): Observable<any> {
    let token = JSON.parse(localStorage.getItem('token'));
    return this.http
      .get(workflow.downloadLink, {
        headers: new HttpHeaders({
          Authorization: 'Bearer ' + token['token']['value'],
        }),
        responseType: 'blob',
      })
      .pipe(
        retry(3),
        tap((data) => console.log('RO-Create downloaded')),
        catchError(this.handleError('download RO-Crate', []))
      );
  }

  subscribeWorkflow(workflow: Workflow): Observable<Workflow> {
    return this.http
      .post(
        this.apiBaseUrl + '/workflows/' + workflow.uuid + '/subscribe',
        {},
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((subscription) => {
          console.log('Created new subscription', subscription);
          if (subscription) {
            workflow.subscriptions.push(subscription);
          }
          return workflow;
        }),
        tap((data) => console.log('Workflow visibility changed to: ', data))
      );
  }

  unsubscribeWorkflow(workflow: Workflow): Observable<Workflow> {
    return this.http
      .post(
        this.apiBaseUrl + '/workflows/' + workflow.uuid + '/unsubscribe',
        {},
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map(() => {
          console.log('Subscription to workflow deleted');
          for (let i = 0; i < workflow.subscriptions.length; i++) {
            let s = workflow.subscriptions[i];
            if (s['resource']['uuid'] === workflow.uuid) {
              workflow.subscriptions.splice(i, 1);
            }
          }
          return workflow;
        }),
        tap((data) => console.log('Workflow visibility changed to: ', data))
      );
  }

  get_workflows(
    filteredByUser: boolean = false,
    includeSubScriptions: boolean = false
  ): Observable<object> {
    console.log(
      'Loading workflows params',
      filteredByUser,
      includeSubScriptions
    );
    let url: string = !filteredByUser
      ? this.apiBaseUrl + '/workflows?status=true'
      : this.apiBaseUrl +
      '/users/current/workflows?status=true&subscriptions=' +
      includeSubScriptions.toString();
    return this.http.get(url, this.get_http_options()).pipe(
      retry(3),
      tap((data) => console.log('Loaded workflows: ', data)),
      catchError(this.handleError('get_workflows', []))
    );
  }

  get_workflow(
    uuid: string,
    previous_versions = false,
    ro_crate = false,
    load_suites = true
  ): Observable<Workflow> {
    console.log('Request login');
    const workflow = this.http.get<Workflow>(
      this.apiBaseUrl + '/workflows/' + uuid,
      this.get_http_options({
        previous_versions: previous_versions,
        ro_crate: ro_crate,
      })
    );

    const status = this.http.get<Status>(
      this.apiBaseUrl + '/workflows/' + uuid + '/status',
      this.get_http_options()
    ).pipe(retry(3));

    let w = new Workflow({ uuid: uuid });
    const suites = this.get_suites(w);

    let queries: Array<object> = [workflow, status];
    if (load_suites) {
      queries = [workflow, status, suites];
    }

    return forkJoin(queries).pipe(
      map((result) => {
        w.update(result[0]);
        w.status = result[1];
        w.suites = new AggregatedStatusStats(result[2]);
        console.log('workflow', w);
        return w;
      }),
      tap((result) => console.log('Loaded workflow: ', result)),
      retry(3),
    );
  }

  get_suites_parallel(uuid: string): Observable<Suite[]> {
    console.log('Loading suites....');
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
          let suite: Suite = new Suite({} as Workflow, suiteData);
          suite.status = new Status({
            aggregated_test_status: status['status'],
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
                    console.log(
                      'Latest builds result',
                      instaceLatestBuildsData,
                      suite,
                      instanceData
                    );
                    console.log('Instance Data', instanceData);
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
                    console.debug('Loaded latest test instance builds', result);
                  })
                )
            );
          }

          return forkJoin(instanceBuildsQueries).pipe(
            retry(3),
            map((instanceLatestBuilds) => {
              return suite;
            })
          );
        })
      );
  }

  get_suites(workflow: Workflow): Observable<Suite[]> {
    console.log('Loading suites....');
    return this.http
      .get<Suite[]>(
        this.apiBaseUrl + '/workflows/' + workflow.uuid + '/suites',
        this.get_http_options()
      )
      .pipe(
        retry(3),
        map((rawSuitesData) => {
          return rawSuitesData['items'];
        }),
        mergeMap((rawSuitesData: []) => {
          console.log('Suites', rawSuitesData);

          let dataIndexMap: { [key: string]: number } = {};
          let queries = [];
          for (let suite of rawSuitesData) {
            dataIndexMap[suite['uuid']] = queries.length;
            queries.push(
              this.http.get<Status>(
                this.apiBaseUrl + '/suites/' + suite['uuid'] + '/status',
                this.get_http_options()
              )
            );

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

          return forkJoin(queries).pipe(
            retry(3),
            mergeMap((statuses) => {
              console.log(
                'Suite statuses after forkjoin',
                statuses,
                rawSuitesData
              );

              let suites: Array<Suite> = [];
              for (let suiteData of rawSuitesData) {
                let suite: Suite = new Suite(workflow, suiteData);
                let status = statuses[dataIndexMap[suiteData['uuid']]];
                suite.status = new Status({
                  aggregated_test_status: status['status'],
                });
                suite.latestBuilds = status['latest_builds'];
                suite.instances = new InstanceStats();

                let listOfinstances: Array<any> = suiteData['instances'];
                for (let instanceData of listOfinstances) {
                  let instaceLatestBuildsData =
                    statuses[dataIndexMap[instanceData['uuid']]];
                  let instance = new TestInstance(suite, instanceData);
                  instance.latestBuilds = instaceLatestBuildsData['items'].map(
                    (x: object) => new TestBuild(instance, x)
                  );
                  suite.instances.add(instance);
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
          console.log('Suite data:', data);
          //return of(new Suite({} as Workflow, data));
          return this.loadSuite(data).pipe(
            map((suite: Suite) => {
              return suite;
            })
          );
          //return s;
        }),
        tap((result) => {
          console.debug('Loaded suite', result);
        })
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
          console.debug('Loaded suite test instances', result);
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
          console.debug('Loaded latest test instance builds', result);
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
          console.debug('Loaded logs of test instance build', buildID, result);
        })
      );
  }

  public checkROCrateAvailability(workflow: Workflow): Observable<boolean> {
    return this.http
      .head(workflow.downloadLink, this.get_http_options({}, true))
      .pipe(
        retry(3),
        map((result) => {
          console.log('Result: ', result);
          return true;
        }),
        catchError((err) => {
          console.log('Error', err);
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
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
