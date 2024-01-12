/*
Copyright (c) 2020-2024 CRS4

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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
    this.setNameFromProperty(rawData, 'name', rawData['roc_suite']);
  }

  public update(rawData: Object) {
    if (rawData) {
      super.update(rawData);
      this.setNameFromProperty(rawData, 'name', rawData['roc_suite']);
    }
  }

  public asUrlParam() {
    return Suite.getUrlParam(
      this.workflow.uuid,
      this.workflow.version['version'],
      this.uuid
    );
  }

  public static getUrlParam(
    workflow_uuid: string,
    workflow_version: string,
    suite_uuid: string
  ): string {
    return btoa(
      JSON.stringify({
        workflow: workflow_uuid,
        version: workflow_version,
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
