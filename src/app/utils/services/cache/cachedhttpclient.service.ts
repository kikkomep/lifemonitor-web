import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { from, Observable, Subject, Subscription } from 'rxjs';
import { Logger, LoggerManager } from 'typescript-logger';
import { AuthService } from '../auth.service';
import { AppConfigService } from '../config.service';
import { InputDialogService } from '../input-dialog.service';
import {
    CachedRequest,
    CachedRequestInit,
    CachedResponse,
    CacheManager
} from './cache-manager';
import { CacheService } from './cache.service';

declare var $: any;

@Injectable({
  providedIn: 'root',
})
export class CachedHttpClientService {
  private apiBaseUrl: string = null;
  private syncInterval: number = 5 * 60 * 1000;
  private httpOptions: object = null;

  // initialize logger
  private logger: Logger = LoggerManager.create('CachedHttoClient');

  private workflowVersionUpdateSubject: Subject<{
    uuid: string;
    version: string;
  }> = new Subject<{ uuid: string; version: string }>();
  public onWorkflowVersionUpdate: Observable<{
    uuid: string;
    version: string;
  }> = this.workflowVersionUpdateSubject.asObservable();

  private subscription: Subscription;
  private cache: CacheManager = new CacheManager('api:lm');

  private worker: Worker;

  constructor(
    private http: HttpClient,
    private config: AppConfigService,
    private cacheService: CacheService,
    private dialog: InputDialogService,
    private authService: AuthService
  ) {
    // this.syncInterval = Number(this.config.getConfig()['syncInterval']);
    this.apiBaseUrl = this.config.getConfig()['apiBaseUrl'];
    this.logger.debug('API Service created');

    this.startWorker();

    this.cache.onCacheEntryUpdated = (
      request: CachedRequest,
      response: CachedResponse
    ) => {
      console.log('Updated entry', request, response);
    };

    this.cache.onCacheEntriesGroupUpdated = (
      groupName: string,
      entries: {
        [key: string]: { request: CachedRequest; response: CachedResponse };
      }
    ) => {
      console.log('Cache group', groupName, entries);
    };

    this.cache.onCacheEntryDeleted = (key: string) => {
      console.log('Cache entry DELETED', key);
    };

    this.cache.onCacheEntriesGroupDeleted = (
      groupName: string,
      entries: Array<string>
    ) => {
      console.log('Cache group DELETED', groupName, entries);
    };

    // $(window)
    //   .on(
    //     'beforeunload',
    //     (evt: Event) => {
    //       evt.preventDefault();
    //       this.dialog.show({
    //         description: 'Confirm',
    //       });
    //       return false;
    //     },
    //     { capture: true }
    //   )
    //   .on('load', (evt) => {
    //     if (performance.navigation.type == 1) {
    //       alert('This page is reloaded');
    //     } else {
    //       console.info(
    //         'This page is not reloaded or just called with empty cache'
    //       );
    //     }
    //   });
  }

  public startWorker() {
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker = new Worker('./cache.worker', {
        type: 'module',
      });

      this.worker.onmessage = (event) => {
        console.log('received message from worker', event.data);
        try {
          if (!event.data || !('type' in event.data)) {
            console.warn(
              "Invalid worker message: unable to find the 'type' property"
            );
            return;
          }
          console.log('received message from worker', event.data['type']);
          const fnName =
            'on' +
            event.data['type'][0].toUpperCase() +
            event.data['type'].slice(1);
          console.log('Function name:', fnName);
          this[fnName](event.data['payload']);
        } catch (e) {
          console.error(e);
        }
      };
      this.worker.postMessage({ message: 'hello WorkerTS' });

      // if (!document.hidden) {
      //   setTimeout(() => {
      //     this.worker.postMessage({ type: 'refresh' });
      //   }, 20000);
      //   this.enableBackgroundRefresh(this.syncInterval);
      // }
      // document.addEventListener('visibilitychange', (e) =>
      //   this.onVisibilityChanged(e)
      // );
    } else {
      // Web Workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

  public onCacheEntryCreated(entry: { request: string; data: object }) {
    console.log('onCacheEntryCreated', entry);
  }

  public onCacheEntryUpdated(entry: { request: string; data: object }) {
    console.log('onCacheEntryUpdated', entry);
  }

  public onCacheEntryDeleted(entry: { key: string }) {
    console.log('onCacheEntryDeleted', entry);
  }

  public onCacheEntriesGroupCreated(group: {
    groupName: string;
    entries: {
      [key: string]: { request: string; data: object };
    };
  }) {
    console.log('onCacheEntriesGroupCreated', group);
  }

  public onCacheEntriesGroupUpdated(group: {
    groupName: string;
    entries: {
      [key: string]: { request: string; data: object };
    };
  }) {
    console.log('onCacheEntriesGroupUpdated', group);
  }

  public onCacheEntriesGroupDeleted(group: {
    groupName: string;
    entries: Array<string>;
  }) {
    console.log('onCacheEntriesGroupDeleted', group);
  }

  private enableBackgroundRefresh(interval: number = 5 * 60 * 1000) {
    this.worker.postMessage({
      type: 'start',
      payload: { interval: interval },
    });
  }

  public onVisibilityChanged(e) {
    console.debug('visibility', e, document.hidden);
    if (!document.hidden) {
      this.enableBackgroundRefresh();
    } else {
      this.worker.postMessage({ type: 'pause' });
    }
  }

  /**
   * Constructs a `GET` request that interprets the body as an `ArrayBuffer` and returns the
   * response in an `ArrayBuffer`.
   *
   * @param url     The endpoint URL.
   * @param options The HTTP options to send with the request.
   *
   * @return An `Observable` of the response, with the response body as an `ArrayBuffer`.
   */
  public get<T>(
    url: string,
    options: {
      headers?:
        | HttpHeaders
        | {
            [header: string]: string | string[];
          };
      observe?: 'body';
      params?:
        | HttpParams
        | {
            [param: string]: string | string[];
          };
      reportProgress?: boolean;
      // responseType: 'json';
      withCredentials?: boolean;
      cacheEntry?: string;
      cacheGroup?: string;
      cacheTTL?: number;
    }
  ): Observable<T> {
    // console.debug('HEADERS input', options);
    const headers = {};
    if (options.headers instanceof HttpHeaders) {
      for (let k of options.headers.keys()) {
        // console.log('HEADERS...', k, options.headers[k]);
        headers[k] = options.headers[k];
      }
    } else {
      for (let k in options.headers) {
        if (typeof options.headers[k] === 'string') {
          headers[k] = options.headers[k] as string;
        } else {
          headers[k] = (options.headers[k] as string[]).join(',');
        }
      }
    }

    const input = new URL(url);
    if (options.params instanceof HttpParams) {
      for (let k of options.params.keys()) {
        if (typeof options.params[k] === 'string') {
          input.searchParams.append(k, options.params[k] as string);
        } else {
          input.searchParams.append(
            k,
            (options.params[k] as string[]).join(',')
          );
        }
      }
    }

    let init: CachedRequestInit = {
      ...options,
      headers: headers,
    };

    // console.debug('Cache Request Init', init);

    return from(
      this.cache.fetch(input.toString(), init).then(async (r) => {
        const v = await r.json();
        return v as T;
      })
      // .catch((error: FetchError) => {
      //   this.logger.error('Detected client error X', error);
      //   console.debug('ERROR', error.response);
      //   if (error.status === 401 && error.statusText === 'UNAUTHORIZED') {
      //     this.logger.warn('Authorization error detected');

      //     const isUserLogged = this.authService.isUserLogged();
      //     this.authService.logout();
      //     if (isUserLogged) {
      //       this.r
      //     }
      //   }

      //   throw error;
      // })
    );
  }

  public post<T>(
    url: string,
    body: any | null,
    options: {
      headers?:
        | HttpHeaders
        | {
            [header: string]: string | string[];
          };
      observe?: 'body';
      params?:
        | HttpParams
        | {
            [param: string]: string | string[];
          };
      reportProgress?: boolean;
      responseType: 'json';
      withCredentials?: boolean;
    }
  ): Observable<T> {
    return this.http.post<T>(url, body, options);
  }

  public delete<T>(
    url: string,
    options: {
      headers?:
        | HttpHeaders
        | {
            [header: string]: string | string[];
          };
      observe?: 'body';
      params?:
        | HttpParams
        | {
            [param: string]: string | string[];
          };
      reportProgress?: boolean;
      responseType: 'json';
      withCredentials?: boolean;
    }
  ): Observable<T> {
    return this.http.delete<T>(url, options);
  }

  public async refresh(): Promise<{ [req: string]: Response }> {
    return await this.cache.refresh();
  }

  public async deleteCacheEntryByURL(url: string): Promise<boolean> {
    return await this.cache.deleteCacheEntryByURL(url);
  }

  public async deleteCacheEntriesByURLs(urls: string[]): Promise<boolean[]> {
    const result: Array<boolean> = [];
    for (let url of urls) {
      result[url] = await this.cache.deleteCacheEntryByURL(url);
    }
    return result;
  }

  public async deleteCacheEntryByKey(key: string): Promise<boolean> {
    return await this.cache.deleteCacheEntryByKey(key);
  }

  public async deleteCacheEntriesByKeys(keys: string[]): Promise<boolean[]> {
    const result: Array<boolean> = [];
    for (let k of keys) {
      result[k] = await this.cache.deleteCacheEntryByKey(k);
    }
    return result;
  }

  public async deleteCacheEntriesGroup(
    group: string | object
  ): Promise<boolean> {
    const groupKey: string =
      typeof group === 'string' ? group : JSON.stringify(group);
    return await this.cache.deleteCacheEntriesGroup(groupKey);
  }
}
