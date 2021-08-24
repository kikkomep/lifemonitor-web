import {
  AggregatedStatusStats,
  AggregatedStatusStatsItem,
  InstanceStats,
  Status,
  StatusStatsItem,
} from './stats.model';
import { Workflow } from './workflow.model';

export class Suite extends AggregatedStatusStatsItem {
  public roc_suite: string;
  public instances: InstanceStats;
  public status: Status;
  public definition: { test_engine: { type: string; version: string } };

  private _latest: StatusStatsItem[] = null;

  constructor(public workflow: Workflow, rawData: object) {
    super(rawData);
    this.name = this.roc_suite.replace('#', '');
  }

  public get latestTestInstanceBuilds(): InstanceStats {
    return new InstanceStats(
      this.latestBuilds.map((x: Object) => new StatusStatsItem(x))
    );
  }

  public getLatestBuilds(): StatusStatsItem[] {
    if (!this._latest) {
      let latestBuilds: StatusStatsItem[] = [];
      for (let inst of this.instances.all) {
        for (let b of inst.latestBuilds) {
          latestBuilds.push(b);
        }
      }
      this._latest = latestBuilds.sort((a, b) =>
        a.timestamp >= b.timestamp ? 1 : -1
      );
    }
    return this._latest;
  }

  public get engineIcon(): string {
    let engine_logo_base_path = '/assets/img/logo/engines/';
    if (this.definition.test_engine.type === 'planemo') {
      return engine_logo_base_path + 'planemo.png';
    }
    console.log(this.definition, this);
    return '';
  }
}
