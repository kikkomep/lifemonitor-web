import { TestingService } from './service.modes';
import {
  InstanceStats, StatusStatsItem
} from './stats.model';
import { Suite } from './suite.models';
import { TestBuild } from './testBuild.models';

// export class TestInstanceStatus extends Status{
//     latestBuilds: TestInstanceStats;
// }

export class TestInstance extends StatusStatsItem {
  public uuid: string;
  public name: string;
  public roc_instance: string;
  private _service: TestingService;
  private _latest: StatusStatsItem[];
  private links: [];

  constructor(public suite: Suite, rawData: Object) {
    super(rawData);
  }

  public set service(data: TestingService) {
    this._service = new TestingService(data);
  }

  public get service(): TestingService {
    return this._service;
  }

  getStatus(): string {
    if (this.latestBuilds && this.latestBuilds.length > 0) {
      return this.latestBuilds[0]['status'];
    }
    return 'unavailable';
  }

  public get platformIcon(): string {
    return this.service
      ? '/assets/img/logo/testingServices/' + this.service.type + '.png'
      : 'unknown.png';
  }

  public get latestTestInstanceBuilds(): InstanceStats {
    return new InstanceStats(
      this.latestBuilds.map((x: Object) => new StatusStatsItem(x))
    );
  }

  public getLatestBuilds(): StatusStatsItem[] {
    if (!this._latest) {
      let latestBuilds: StatusStatsItem[] = [];
      for (let b of this.latestBuilds) {
        latestBuilds.push(new TestBuild(this, b));
      }
      this._latest = latestBuilds.sort((a, b) =>
        a.timestamp >= b.timestamp ? 1 : -1
      );
    }
    return this._latest;
  }

  public get externalLink() {
    return this.links && 'origin' in this.links ? this.links['origin'] : null;
  }
}
