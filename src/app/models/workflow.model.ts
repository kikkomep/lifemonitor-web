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
  type: string = 'galaxy'; // FIXME
  _suites: AggregatedStatusStats;
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
      this._suites = suites;
    }
  }

  public get suites(): AggregatedStatusStats {
    return this._suites;
  }

  public set suites(suites: AggregatedStatusStats) {
    this._suites = suites;
    this.notifyChanges();
  }

  public asUrlParam() {
    return this.uuid;
  }

  public get typeIcon(): string {
    // FIXME: set the right icon type
    return 'assets/img/logo/wf/GalaxyLogoSquare.png';
  }

  public get externalLink(): string {
    if (this.version) {
      return this.version['links']['origin'];
    } else {
      return null;
    }
  }

  public get metadataLink(): string {
    return this.version['ro_crate']['links']['metadata'];
  }

  public get downloadLink(): string {
    return this.version['ro_crate']['links']['download'];
  }

  get testInstances() {
    let instances = [];
    for (let s of this.suites.all) {
      for (let i of s['instances']['all']) instances.push(i);
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
