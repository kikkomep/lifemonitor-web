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
    if (rawData)
      this.setNameFromProperty(rawData, 'name', rawData['roc_instance']);
  }

  public update(rawData: Object) {
    if (rawData) {
      super.update(rawData);
      this.setNameFromProperty(rawData, 'name', rawData['roc_instance']);
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
