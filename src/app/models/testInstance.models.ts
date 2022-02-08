import { TestingService } from './service.modes';
import { InstanceStats, StatusStatsItem } from './stats.model';
import { Suite } from './suite.models';
import { TestBuild } from './testBuild.models';

export class TestInstance extends StatusStatsItem {
  public uuid: string;
  public name: string;
  public roc_instance: string;
  private _service: TestingService;
  private _latest: StatusStatsItem[];
  private links: [];

  constructor(public suite: Suite, rawData: Object) {
    super(rawData);
    this.setName(rawData);
  }

  public update(rawData: Object) {
    super.update(rawData);
    this.setName(rawData);
  }

  private setName(data: Object) {
    let name: string = null;
    if ("name" in data) {
      name = data["name"];
      if (name && name.length > 0)
        this.name = name;
    }
    if (!name) {
      this.name = this.uuid.replace('#', '');
    }
  }

  public set service(data: TestingService) {
    this._service = new TestingService(data);
    this._service.url = this.links['origin'];
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
      try {
        let latestBuilds: StatusStatsItem[] = [];
        for (let b of this.latestBuilds) {
          latestBuilds.push(new TestBuild(this, b));
        }
        this._latest = latestBuilds.sort((a, b) =>
          a.timestamp >= b.timestamp ? 1 : -1
        );
      } catch (e) {
        this.logger.warn('Unable to load last builds');
        this._latest = [];
      }
    }
    return this._latest;
  }

  public get externalLink() {
    return this.links && 'origin' in this.links ? this.links['origin'] : null;
  }
}
