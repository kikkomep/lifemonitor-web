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

import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Logger, LoggerManager } from '../utils/logging';
export class UrlValue {
  _url: string;
  _error: string;

  // initialize logger
  private logger: Logger = LoggerManager.create('UrlValue');

  constructor(private httpClient: HttpClient) { }

  public get isValid(): boolean {
    this._error = null;
    if (!this.checkIsValid(this._url)) {
      this._error = 'Please provide a valid URL';
      return false;
    }
    // else if (!this.exists(this._url)) {
    //   this._error = 'Unable to reach the remote RO-Crate';
    //   return false;
    // }
    return true;
  }

  public get error(): string {
    return this._error;
  }

  public get url(): string {
    return this._url;
  }

  public set url(value: string) {
    this._url = value;
  }

  public asURL(): URL {
    return new URL(this._url);
  }

  public checkIsValid(url: string): boolean {
    try {
      this.logger.debug("Checking URL", url);
      let u = new URL(url);
      this.logger.debug("Checking URL " + url + " OK", u);
      return true;
    } catch (ex) {
      this.logger.debug("URL not valid", url);
      return false;
    }
  }

  async exists(url: string) {
    if (!url) return false;
    let result = await this.httpClient
      .head(url)
      .toPromise()
      .then((data) => {
        this.logger.debug("URL exists", data);
        return true;
      })
      .catch((reason) => {
        this.logger.debug("Unable to get URL", url);
        return false;
      });
    this.logger.debug('Result', result);
    return result;
  }
}



export class RoCrate {

  private data: object;

  constructor(jsonLD: object) {
    this.data = jsonLD;
  }

  public get jsonLD(): object {
    return this.data;
  }

  public get rootDataSet(): object {
    return this.findGraphEntity('./', 'Dataset');
  }

  public get mainEntity(): object {
    let root = this.rootDataSet;
    return root && 'mainEntity' in root
      ? this.findGraphEntity(root['mainEntity']['@id']) : null;
  }

  public get graphEntities(): [] {
    return this.data && "@graph" in this.data ? this.data['@graph'] : null;
  }

  public listGraphEntityIdentifiers(): any[] {
    let entities: [] = this.graphEntities;
    return entities ? entities.map(function (e) { return e['@id']; }) : [];
  }

  public findGraphEntity(id: string, type: string = null) {
    let entities: [] = this.graphEntities;
    if (!entities) return null;
    return entities.find(
      (e: any) => e['@id'] === id && (!type || e['@type'] === type)
    );
  }

}


export class DateUtils {

  public static formatTimestamp(value: string): string {
    try {
      let timestamp = parseInt(value);
      let d = new Date(timestamp);
      if (d.getFullYear() === 1970)
        timestamp *= 1000;
      return formatDate(timestamp, 'M/d/yy, hh:mm z', 'en-US');
    } catch (e) {
      return value;
    }
  }
}


export class MouseClickHandler {
  private timer: any = 0;
  private delay = 250;
  private preventSingleClick = false;

  public click(clickAction: () => void) {
    this.preventSingleClick = false;
    this.timer = setTimeout(() => {
      if (!this.preventSingleClick) {
        clickAction();
      }
    }, this.delay);
  }

  public doubleClick(dbclickAction: () => void) {
    this.preventSingleClick = true;
    clearTimeout(this.timer);
    dbclickAction();
  }
}
