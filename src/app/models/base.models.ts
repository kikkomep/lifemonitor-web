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

import { Observable, Subject } from 'rxjs';
import { Logger, LoggerManager } from '../utils/logging';

export class Property {
  private _name: string;
  private _value: any;

  constructor(name: string, value: any) {
    this._name = name;
    this._value = value;
  }

  public get name() {
    return this._name;
  }

  public get value() {
    return this._value;
  }
}

export class Model {
  // reference to rawData
  protected _rawData: Object;

  // initialize data sources
  private subject = new Subject<Property | Model>();

  // initialize data observables
  private _asObservable = this.subject.asObservable();

  // initialize logger
  protected logger: Logger = null;

  constructor(private rawData?: Object, skip?: []) {
    this.logger = LoggerManager.create(this.constructor.name);
    this.update(rawData);
  }

  public getRawData(): Object {
    return this._rawData;
  }

  protected setNameFromProperty(data: Object, propertyName: string = "name", defaultValue: any = null) {
    let name: string = null;
    if (propertyName in data) {
      name = data[propertyName];
      if (name && name.length > 0)
        this["name"] = name;
    }
    if (!name) {
      this["name"] = defaultValue;
    }
  }

  public update(rawData: Object) {
    if (rawData) {
      Object.assign(this, rawData);
      this._rawData = rawData;
      this.notifyChanges();
    }
  }

  // Allow class clients to subscribe in order to be notified when a changes occurs
  public asObservable(): Observable<Property | Model> {
    return this._asObservable;
  }

  public asUrlParam() {
    return btoa(JSON.stringify({}));
  }

  // Allow subclasses to notify changes
  protected notifyChanges(propertyName?: string, propertyValue?: any) {
    if (propertyName && propertyValue) {
      this.subject.next(new Property(propertyName, propertyName));
    } else {
      this.subject.next(this);
    }
    this.logger.debug('Change notified', this);
  }
}
