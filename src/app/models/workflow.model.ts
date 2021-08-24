import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
  Status,
} from './stats.model';
import { Suite } from './suite.models';
import { TestBuild } from './testBuild.models';

export class Workflow extends AggregatedStatusStatsItem {
  registry: Object;
  version: Object;
  status: Status;
  suites: AggregatedStatusStats;
  private _latestBuilds: TestBuild[];

  constructor(
    private data: Object,
    status?: Object,
    suites?: AggregatedStatusStats
  ) {
    super(data);
    if (status) {
      this.status = new Status(status);
    }
    if (suites) {
      this.suites = suites;
    }
  }

  public get typeIcon(): string {
    // FIXME: set the right icon type
    return 'assets/img/logo/wf/GalaxyLogoSquare.png';
  }

  get testInstances() {
    let instances = [];
    for (let s of this.suites.all) {
      for (let i of s['instances']['all'])
        instances.push(i);
    }
    return instances;
  }

  getStats() {
    return [];
  }

  public getLatestBuilds(): TestBuild[] {
    if (!this._latestBuilds) {
      if (!this.suites) return null;
      let latestBuilds: TestBuild[] = [];
      for (let item of this.suites.all) {
        let suite: Suite = item as Suite;

        for (let inst of suite.instances.all) {
          for (let b of inst.latestBuilds) {
            latestBuilds.push(b);
          }
        }
      }

      this._latestBuilds = latestBuilds.sort((a, b) =>
        a.timestamp >= b.timestamp ? 1 : -1
      );
    }

    return this._latestBuilds;
  }
}
