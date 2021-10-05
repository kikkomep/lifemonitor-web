import { Observable, Subject } from 'rxjs';

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

  constructor(private rawData?: Object, skip?: []) {
    this.update(rawData);
  }

  public update(rawData: Object){
    if (rawData) {
      Object.assign(this, rawData);
      this._rawData = rawData;
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
    console.log('Change notified', this);
  }
}
