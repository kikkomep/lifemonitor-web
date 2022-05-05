import {
  AggregatedStatusStatsItem,
  InstanceStats,
  Status,
  StatusStatsItem,
} from './stats.model';
import { WorkflowVersion } from './workflow.model';

export class Suite extends AggregatedStatusStatsItem {
  public roc_suite: string;
  public instances: InstanceStats;
  public status: Status;
  public definition: { test_engine: { type: string; version: string } };

  private _latest: StatusStatsItem[] = null;

  constructor(public workflow: WorkflowVersion, rawData: object) {
    super(rawData);
    this.setNameFromProperty(rawData, "name", rawData['roc_suite']);
  }

  public update(rawData: Object) {
    super.update(rawData);
    this.setNameFromProperty(rawData, "name", rawData['roc_suite']);
  }

  public asUrlParam() {
    return Suite.getUrlParam(this.workflow.uuid, this.uuid);
  }

  public static getUrlParam(workflow_uuid: string, suite_uuid: string): string {
    return btoa(
      JSON.stringify({
        workflow: workflow_uuid,
        suite: suite_uuid,
      })
    );
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
        for (let inst of this.instances.all) {
          for (let b of inst.latestBuilds) {
            latestBuilds.push(b);
          }
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

  public get engineType(): string {
    if (this.definition && 'test_engine' in this.definition)
      return this.definition.test_engine.type;
    return 'unknown';
  }

  public get engineIcon(): string {
    let engine_logo_base_path = '/assets/img/logo/engines/';
    if (this.engineType === 'planemo') {
      return engine_logo_base_path + 'planemo.png';
    }
    return '';
  }
}
