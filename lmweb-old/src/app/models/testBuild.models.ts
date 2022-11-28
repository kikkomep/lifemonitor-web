import { InstanceStats, StatusStatsItem } from './stats.model';
import { TestInstance } from './testInstance.models';

export class TestBuild extends StatusStatsItem {
  public uuid: string;
  public build_id: string;
  public suite_uuid: string;
  public instance: TestInstance;
  public duration: number;
  private links: [];

  constructor(public testInstance: TestInstance, rawData: object) {
    super(rawData);
    this.name = this.build_id;
  }

  getStatus(): string {
    return this.status;
  }

  public get latestTestInstanceBuilds(): InstanceStats {
    return new InstanceStats(
      this.latestBuilds.map((x: Object) => new StatusStatsItem(x))
    );
  }

  public get startTime() {
    return this.timestamp * 1000;
  }

  public get externalLink() {
    return this.links && 'origin' in this.links ? this.links['origin'] : null;
  }
}
