import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { URLHandler } from '../url-handler/handler';

// Set error message
export const apiNotConfiguredErrorMessage = 'BaseApiUrl not configured!';

// Set ApiKey keyword
const authApiKey = 'ApiKey';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  private urlHandler?: URLHandler;
  private _apiKey?: string;

  constructor(protected httpClient: HttpClient) {}

  public get apiKey(): string | undefined {
    return this._apiKey;
  }

  public initialize(baseApiUrl: string, apiKey?: string) {
    this.urlHandler = new URLHandler(baseApiUrl);
    this._apiKey = apiKey;
  }

  public get baseApiUrl(): string {
    if (!this.urlHandler) throw Error(apiNotConfiguredErrorMessage);
    return this.urlHandler.baseUrl;
  }

  private getUrl(pathName: string): string {
    if (!this.urlHandler) throw Error(apiNotConfiguredErrorMessage);
    return this.urlHandler.buildUrl(pathName);
  }

  private buildHeader(options?: any): any {
    const result = options?.headers ? { ...options.headers } : {};
    if (this.apiKey && options?.withCredentials) {
      result['Authorization'] = `${authApiKey}: ${this.apiKey}`;
    }
    return result;
  }

  public doGet(
    pathName: string,
    options?: {
      headers?:
        | HttpHeaders
        | {
            [header: string]: string | string[];
          };
      context?: HttpContext;
      observe?: 'body';
      params?:
        | HttpParams
        | {
            [param: string]:
              | string
              | number
              | boolean
              | ReadonlyArray<string | number | boolean>;
          };
      reportProgress?: boolean;
      responseType?: 'json';
      withCredentials?: boolean;
    }
  ): Observable<any> {
    return this.httpClient.get<any>(this.getUrl(pathName), {
      ...options,
      headers: this.buildHeader(options),
    });
  }
}
