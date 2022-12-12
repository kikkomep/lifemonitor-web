export class URLHandler {
  private _baseUrl: string;

  constructor(baseUrl: string) {
    this._baseUrl = baseUrl;
  }

  public get baseUrl(): string {
    return this._baseUrl;
  }

  public buildUrl(pathName?: string, params?: any): string {
    const result = new URL(this._baseUrl);
    if (pathName && pathName.length > 0)
      result.pathname = pathName.replace(/\/+$/, '');
    if (params) {
      Object.keys(params).forEach((name: string) => {
        result.searchParams.append(name, params[name]);
      });
    }
    return result.toString();
  }
}
