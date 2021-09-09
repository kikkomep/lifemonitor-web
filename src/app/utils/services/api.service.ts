import { AppConfigService } from './config.service';
import { Injectable } from '@angular/core';
import { Observable, of, Subject, throwError, forkJoin, from } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, mergeMap, retry, tap } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { Workflow } from 'src/app/models/workflow.model';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import { Suite } from 'src/app/models/suite.models';
import {
  InstanceStats,
  Status,
  StatusStatsItem,
} from 'src/app/models/stats.model';
import { TestInstance } from 'src/app/models/testInstance.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { User } from 'src/app/models/user.modes';

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

  private get_http_options(params = {}) {
    let token = JSON.parse(localStorage.getItem('token'));
    return {
      headers: new HttpHeaders({
        // 'Content-Type':  'application/json',
        Authorization: 'Bearer ' + token['token']['value'],
      }),
      params: params,
    };
  }

  get_current_user(): Observable<User> {
    return this.http
      .get(this.apiBaseUrl + '/users/current', this.get_http_options())
      .pipe(
        map((data) => {
          return new User(data);
        })
      );
  }

  get_workflows(): Observable<object> {
    console.log('Request login');
    return this.http
      .get(this.apiBaseUrl + '/workflows', this.get_http_options())
      .pipe(
        tap((data) => console.log('Loaded workflows: ', data)),
        catchError(this.handleError('get_workflows', []))
      );
  }

  get_workflow(
    uuid: string,
    previous_versions = false,
    ro_crate = false
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
    );

    return forkJoin([workflow, status /*, suites*/]).pipe(
      map((result) => {
        let w = new Workflow(result[0], result[1] /*, result[2]['items']*/);
        console.log('workflow', w);
        return w;
      }),
      tap((result) => console.log('Loaded workflow: ', result))
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
        mergeMap((status: Object) => {
          let suite: Suite = new Suite({} as Workflow, suiteData);
          suite.status = new Status({
            aggregated_test_status: status['status'],
          });
          suite.latestBuilds = status['latest_builds'];
          suite.instances = new InstanceStats();

          let instanceBuildsQueries = [];
          for (let isd of suiteData['instances']) {
            const instanceData = suiteData['instances'][isd];
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
        map((rawSuitesData) => {
          return rawSuitesData['items'];
        }),
        mergeMap((rawSuitesData: []) => {
          console.log('Suites', rawSuitesData);

          let queries = [];
          for (let suite of rawSuitesData) {
            queries.push(
              this.http.get<Status>(
                this.apiBaseUrl + '/suites/' + suite['uuid'] + '/status',
                this.get_http_options()
              )
            );
          }

          return forkJoin(queries).pipe(
            mergeMap((statuses) => {
              console.log(
                'Suite statuses after forkjoin',
                statuses,
                rawSuitesData
              );

              let suites: Array<Suite> = [];
              let instanceBuildsQueries = [];
              for (let suite_index in rawSuitesData) {
                let suiteData: Object = rawSuitesData[suite_index];
                let suite: Suite = new Suite(workflow, suiteData);
                let status = statuses[suite_index];
                suite.status = new Status({
                  aggregated_test_status: status['status'],
                });
                suite.latestBuilds = status['latest_builds'];
                suite.instances = new InstanceStats();

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
                        map((instaceLatestBuildsData) => {
                          console.log(
                            'Latest builds result',
                            instaceLatestBuildsData,
                            suite,
                            instanceData
                          );
                          let instance = new TestInstance(suite, instanceData);
                          instance.latestBuilds = instaceLatestBuildsData[
                            'items'
                          ].map((x: object) => new TestBuild(instance, x));
                          suite.instances.add(instance);
                          return instance;
                        }),
                        tap((result) => {
                          console.debug(
                            'Loaded latest test instance builds',
                            result
                          );
                        })
                      )
                  );
                }
                console.log('Instance queries', instanceBuildsQueries);
                suites.push(suite);
              }

              return forkJoin(instanceBuildsQueries).pipe(
                mergeMap((instances) => {
                  return from([suites]);
                })
              );
            })
          );
        })
      );
  }

  getSuite(uuid: string): Observable<any> {
    return this.http
      .get(
        this.apiBaseUrl + '/suites/' + uuid + '/status',
        this.get_http_options()
      )
      .pipe(
        map((data) => {
          let result = {};
        }),
        tap((result) => {
          console.debug('Loaded suites', result);
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
        map((data) => {
          return data;
        }),
        tap((result) => {
          console.debug('Loaded logs of test instance build', buildID, result);
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
