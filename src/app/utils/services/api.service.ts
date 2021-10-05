import { Params } from '@angular/router';
import { AppConfigService } from './config.service';
import { Injectable } from '@angular/core';
import { Observable, of, Subject, throwError, forkJoin, from } from 'rxjs';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { catchError, map, mergeMap, retry, tap } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { Workflow } from 'src/app/models/workflow.model';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import { Suite } from 'src/app/models/suite.models';
import {
  AggregatedStatusStats,
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

  private get_http_options(params = {}, skip: boolean = false) {
    let token = JSON.parse(localStorage.getItem('token'));
    return {
      headers: new HttpHeaders({
        // 'Content-Type':  'application/json',
        Authorization: 'Bearer ' + token['token']['value'],
        skip: String(skip),
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
        tap((data) => console.log('RO-Create downloaded')),
        catchError(this.handleError('download RO-Crate', []))
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
    );

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

  public checkROCrateAvailability(workflow: Workflow): Observable<boolean> {
    return this.http
      .head(workflow.downloadLink, this.get_http_options({}, true))
      .pipe(
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
