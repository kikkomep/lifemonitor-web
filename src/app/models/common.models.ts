import { HttpClient } from '@angular/common/http';

export class UrlValue {
  _url: string;
  _error: string;

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
      let u = new URL(url);
      console.log(u);
      return true;
    } catch (ex) {
      return false;
    }
  }

  async exists(url: string) {
    if (!url) return false;
    let result = await this.httpClient
      .head(url)
      .toPromise()
      .then((data) => {
        console.log(data);
        return true;
      })
      .catch((reason) => {
        console.log('Error', reason);
        return false;
      });
    console.log('Result', result);
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
    return root ? this.findGraphEntity(root['mainEntity']['@id']) : null;
  }

  public get graphEntities(): [] {
    return this.data ? this.data['@graph'] : null;
  }

  public listGraphEntityIdentifiers(): any[] {
    let entities: [] = this.graphEntities;
    return entities ? entities.map(function (e) { return e['@id']; }) : [];
  }

  public findGraphEntity(id: string, type: string = null) {
    return this.data['@graph'].find(
      (e: any) => e['@id'] === id && (!type || e['@type'] === type)
    );
  }

}
