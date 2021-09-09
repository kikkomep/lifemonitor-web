import {
  AggregatedTestStatus,
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
} from 'src/app/models/stats.model';
import { from, Observable, of, Subject, Subscription } from 'rxjs';

import { ApiService } from './api.service';
import { Injectable } from '@angular/core';
import { Workflow } from 'src/app/models/workflow.model';
import { Suite } from 'src/app/models/suite.models';
import { TestBuild } from 'src/app/models/testBuild.models';
import { TestInstance } from 'src/app/models/testInstance.models';
import { map, mergeMap } from 'rxjs/operators';

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

  constructor(private api: ApiService) {
    console.log('AppService created!');

    // subscribe for the current selected workflow
    this.subscriptions.push(
      this._observableWorkflow.subscribe((w: Workflow) => {
        this._workflow = w;
      })
    );

    // preload workflows
    this.loadWorkflows();
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

  loadWorkflows(useCache = false) {
    if (this.loadingWorkflows) return;
    if (useCache) {
      console.log('Using cache', this._workflowsStats);
      this.subjectWorkflows.next(this._workflowsStats);
      return;
    }
    this.loadingWorkflows = true;
    this.api.get_workflows().subscribe(
      (data) => {
        console.log('AppService Loaded workflows', data);

        // Workflow items
        let items = data['items'];

        let stats = new AggregatedStatusStats();

        // patch data
        // let items_copy = [...items];
        // items = [];
        // for (let k of AggregatedTestStatus) {
        //   let t = JSON.parse(JSON.stringify(items_copy[0]));
        //   //t.uuid = t.uuid + items.length;
        //   t.name = t.name + ' (' + k + ')';
        //   t.status.aggregate_test_status = k;
        //   items.push(new Workflow(t));
        // }

        items = items.map((i: object) => new Workflow(i));
        stats.update(items);

        this._workflows = items;
        this._workflowsStats = stats;
        this.subjectWorkflows.next(stats);

        this.loadingWorkflows = false;

        let wf_uuid = sessionStorage.getItem('workflow_uuid');
        for (let w of this._workflows) {
          console.log('Loading data of workflow ', w);
          this.loadWorkflow(w).subscribe((w: Workflow) => {
            if (wf_uuid === w.uuid) {
              this.selectWorkflow(wf_uuid);
            }
          });
        }
      },
      (error) => {
        console.error(error);
      }
    );
  }

  loadWorkflow(w: Workflow): Observable<Workflow> {
    return this.api.get_workflow(w.uuid).pipe(
      mergeMap((wdata: Workflow) => {
        // FIXME: remove this (just for testing)
        let astatus = w.status;
        let wname = w.name;
        // update status
        Object.assign(w, wdata);
        // FIXME: remove this (just for testing)
        w.name = wname;
        w.status.aggregate_test_status = astatus.aggregate_test_status;
        console.log('Loaded data:', w);

        // Load workflow's suites
        return this.api.get_suites(w).pipe(
          map((suites: AggregatedStatusStatsItem[]) => {
            console.log('Loaded suites (from app service)', suites);
            w.suites = new AggregatedStatusStats(suites);
            //this.subjectWorkflow.next(w);
            console.log('Workflow fully loaded!');
            return w;
          })
        );

        // .subscribe((suites) => {
        //   console.log('Loaded suites (from app service)', suites);
        //   w.suites = new AggregatedStatusStats(suites);
        //   //this.subjectWorkflow.next(w);
        //   console.log('Workflow fully loaded!');

        // });
      })
    );
  }

  loadLatestTestInstanceBuilds(instance: Object) {}

  public selectWorkflow(uuid: string): Observable<Workflow> {
    let w: Workflow;
    console.log('Workflows', this._workflows, this._workflowsStats);
    if (this._workflows) {
      w = this._workflows.find((w: Workflow) => w.uuid == uuid);
      if (w) {
        sessionStorage.setItem(this.WORKFLOW_UUID, w.uuid);
        this.subjectWorkflow.next(w);
        return of(w);
      }
    }

    if (!this.workflows || !this.workflow || this.workflow.uuid != uuid) {
      console.log('');
      // return this.api
      //   .get_workflow(uuid, true, true)
      //   .subscribe((w: Workflow) => {
      //     sessionStorage.setItem(this.WORKFLOW_UUID, w.uuid);
      //     // return this.loadWorkflow(w).pipe(map(w => {
      //     //   return of(w);
      //     // }))
      //     return of(w);
      //   });

      return this.api.get_workflow(uuid, true, true).pipe(
        mergeMap((w: Workflow) => {
          return this.loadWorkflow(w).pipe(
            map((w: Workflow) => {
              sessionStorage.setItem(this.WORKFLOW_UUID, w.uuid);
              this.subjectWorkflow.next(w);
              return w;
            })
          );
        })
      );

      // return this.observableWorkflows.pipe(
      //   mergeMap((wfs) => {
      //     console.log('Loaded workflows', wfs);
      //     return this.selectWorkflow(uuid);
      //   })
      // );
    }
  }

  public selectTestSuite(uuid: string): Observable<Suite> {
    if (!this._workflow) {
      let wf_uuid = sessionStorage.getItem(this.WORKFLOW_UUID);
      if (wf_uuid) {
        return this.selectWorkflow(wf_uuid).pipe(
          mergeMap((w) => {
            console.log('Workflow loaded');
            return this._selectTestSuite(uuid);
          })
        );
      }
    } else {
      return this._selectTestSuite(uuid);
    }
  }

  private _selectTestSuite(uuid: string): Observable<Suite> {
    let suite: Suite = this._workflow.suites.all.find(
      (s: Suite) => s.uuid === uuid
    ) as Suite;
    sessionStorage.setItem('suite_uuid', suite.uuid);
    console.log('Selected suite', suite);
    sessionStorage.setItem(this.SUITE_UUID, uuid);
    this._suite = suite;
    this.subjectTestSuite.next(suite);
    return of(suite);
  }

  public selectTestInstance(uuid: string): Observable<TestInstance> {
    if (!this._suite) {
      let suite_uuid = sessionStorage.getItem(this.SUITE_UUID);
      if (suite_uuid) {
        return this.selectTestSuite(suite_uuid).pipe(
          mergeMap((s: Suite) => {
            console.log('TestInstance loaded', s);
            return this._selectTestInstance(uuid);
          })
        );
      }
    } else {
      return this._selectTestInstance(uuid);
    }
  }

  private _selectTestInstance(uuid: string): Observable<TestInstance> {
    let instance: TestInstance = this._suite.instances.all.find(
      (i: TestInstance) => i.uuid === uuid
    ) as TestInstance;
    console.log('Selected test instance', instance);
    sessionStorage.setItem(this.TEST_INSTANCE_UUID, uuid);
    this._testInstance = instance;
    this.subjectTestInstance.next(instance);
    return of(instance);
  }

  public selectTestBuild(buildId: string): Observable<TestBuild> {
    if (!this._testInstance) {
      let instance_uuid = sessionStorage.getItem(this.TEST_INSTANCE_UUID);
      if (instance_uuid) {
        return this.selectTestInstance(instance_uuid).pipe(
          mergeMap((i: TestInstance) => {
            console.log('TestInstance loaded', i);
            return this._selectTestBuild(buildId);
          })
        );
      }
    } else {
      return this._selectTestBuild(buildId);
    }
  }

  private _selectTestBuild(buildId: string): Observable<TestBuild> {
    let build: TestBuild = this._testInstance.latestBuilds.find(
      (b: TestBuild) => b.build_id === buildId
    ) as TestBuild;
    console.log('Selected test instance', build);
    sessionStorage.setItem(this.TEST_BUILD_ID, buildId);
    this._testBuild = build;
    this.subjectTestBuild.next(build);
    return of(build);
  }

  public getTestBuildLogs(build: TestBuild): Observable<string> {
    return this.api.getBuildLogs(build.instance.uuid, build.build_id);
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
