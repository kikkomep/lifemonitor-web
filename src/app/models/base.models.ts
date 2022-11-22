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
  protected logger: Logger = LoggerManager.create("model");

  constructor(private rawData?: Object, skip?: []) {
    this.update(rawData);
    this.logger = LoggerManager.create(this.constructor.name);
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
