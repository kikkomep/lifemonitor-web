import * as deepEqual from 'deep-equal';
import { Logger, LoggerManager } from '../../logging';

export interface CachedRequestInit extends RequestInit {
  cacheEntry?: string;
  cacheGroup?: string;
  cacheTTL?: number;
}

export interface CachedRequest extends Request {
  request?: Request;
  cacheEntry?: string;
  cacheGroup?: string;
  cacheTTL?: number;
  cacheCreatedAt?: number;
}

export interface CachedResponse extends Response {
  cacheEntry?: string;
  cacheGroup?: string;
  cacheTTL?: number;
}

export interface CacheEntriesMap {
  requests: {
    [key: string]: { request: CachedRequest; response: CachedResponse };
  };
  namedEntries: {
    [key: string]: { request: CachedRequest; response: CachedResponse };
  };
  groups: { [key: string]: Array<string> };
  createdAt?: { [key: string]: number };
}

export function getTimeStamp(date?: Date): number {
  return Math.floor((date ?? new Date()).getTime());
}

export class FetchError extends Error {
  private _response: Response;
  private _status: number = 500;
  private _statusText: string = 'ERROR';
  constructor(error: Error, response: Response) {
    super(error.message);
    this.name = error.name;
    this.stack = error.stack;
    this._response = response;
    this._status = response.status;
    this._statusText = response.statusText;

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, FetchError.prototype);
  }

  get response(): Response {
    return this._response;
  }

  get status(): number {
    return this._status;
  }
  get statusText(): string {
    return this._statusText;
  }
}

const defaultCacheTTL = 0; //5 * 60 * 1000;

const logger: Logger = LoggerManager.create('CacheManager');

export class CacheManager {
  private _cacheName: string;

  constructor(cacheName: string) {
    this._cacheName = cacheName;
  }

  public get cacheName(): string {
    return this._cacheName;
  }

  public onCacheEntryCreated: (
    request: CachedRequest,
    response: CachedResponse
  ) => any;

  public onCacheEntryUpdated: (
    request: CachedRequest,
    response: CachedResponse
  ) => any;

  public onCacheEntryDeleted: (key: string) => any;

  public onCacheEntriesGroupCreated: (
    groupName: string,
    entries: {
      [key: string]: { request: CachedRequest; response: CachedResponse };
    }
  ) => any;

  public onCacheEntriesGroupUpdated: (
    groupName: string,
    entries: {
      [key: string]: { request: CachedRequest; response: CachedResponse };
    }
  ) => any;

  public onCacheEntriesGroupDeleted: (
    groupName: string,
    entries: Array<string>
  ) => any;

  private static getRequest(
    url: string | URL,
    init?: CachedRequestInit
  ): CachedRequest {
    // logger.debug("The HEADERS", init.headers);
    const headers: Headers = new Headers({ ...init.headers });
    const createdAt = getTimeStamp();
    if (init.cacheEntry) headers.append('cache-entry', init.cacheEntry);
    if (init.cacheGroup) headers.append('cache-group', init.cacheGroup);
    headers.append('cache-created-at', String(createdAt));
    headers.append('cache-TTL', String(init.cacheTTL ?? defaultCacheTTL));
    headers.append('Access-Control-Allow-Origin', '*');
    const request = new Request(url.toString(), { ...init, headers: headers });
    request['cacheEntry'] = init.cacheEntry;
    request['cacheGroup'] = init.cacheGroup;
    request['cacheTTL'] = Number(init.cacheTTL ?? defaultCacheTTL);
    request['cacheCreatedAt'] = createdAt;
    return request;
  }

  private async findCachedRequestByURL(
    url: string,
    cache?: Cache
  ): Promise<CachedRequest> {
    cache = cache ?? (await caches.open(this._cacheName));
    logger.debug('Searching request on cache...', url, cache);
    for (let req of await cache.keys()) {
      if (req.url === url) {
        req['cacheEntry'] = req.headers.get('cache-entry');
        req['cacheGroup'] = req.headers.get('cache-group');
        req['cacheTTL'] = Number(
          req.headers.get('cache-ttl') ?? defaultCacheTTL
        );
        req['cacheCreatedAt'] = Number(req.headers.get('cache-created-at'));
        logger.debug('Searching request on cache: found', url, req);
        return req;
      }
    }
    logger.debug('Searching request on cache: not found', url, cache);
    return null;
  }

  private async findCachedRequestByKey(
    key: string,
    cache?: Cache
  ): Promise<CachedRequest> {
    cache = cache ?? (await caches.open(this._cacheName));
    for (let req of await cache.keys()) {
      if (req.headers.get('cache-entry') === key) {
        req['cacheEntry'] = req.headers.get('cache-entry');
        req['cacheGroup'] = req.headers.get('cache-group');
        req['cacheTTL'] = Number(
          req.headers.get('cache-ttl') ?? defaultCacheTTL
        );
        req['cacheCreatedAt'] = Number(req.headers.get('cache-created-at'));
        return req;
      }
    }
    return null;
  }

  private async getCachedRequest(
    request: Request | string
  ): Promise<CachedRequest> {
    request =
      typeof request === 'string'
        ? await this.findCachedRequestByURL(request)
        : request;
    const headers: Headers = new Headers();
    request.headers.forEach((v, k) => {
      headers.append(k, v);
    });
    return {
      ...request.clone(),
      request: request.clone(),
      url: request.url,
      headers: headers,
      cacheEntry: headers.get('cache-entry'),
      cacheGroup: headers.get('cache-group'),
      cacheCreatedAt: Number(headers.get('cache-created-at') ?? getTimeStamp()),
      cacheTTL: Number(headers.get('cache-ttl') ?? defaultCacheTTL),
    };
  }

  private static isExpired(cachedReq: CachedRequest): boolean {
    return (
      cachedReq &&
      cachedReq.cacheTTL > 0 &&
      getTimeStamp() - cachedReq.cacheCreatedAt >= cachedReq.cacheTTL
    );
  }

  public async fetch(
    url: string | URL,
    init?: CachedRequestInit,
    notifyUpdates: boolean = true
  ): Promise<Response> {
    const request = CacheManager.getRequest(url, init);
    const cache = await caches.open(this._cacheName);
    let response = await cache.match(request.url);

    const cachedReq = await this.findCachedRequestByURL(url.toString(), cache);
    logger.debug('Check cache entry:', response, cachedReq);
    const isExpired = CacheManager.isExpired(cachedReq);
    if (cachedReq)
      logger.debug(
        `Check cache entry ${url} expiration: expired? ${isExpired}`
      );

    if (
      !response ||
      response.status === 0 ||
      (response.status >= 400 && response.status < 600) ||
      isExpired
    ) {
      logger.debug(`Cache miss for url ${url}`);
      const oldResponse = response ? response.clone() : null;

      let retry = 3;
      while (retry > 0) {
        try {
          response = await fetch(request);
          logger.debug('Request fetch result: ', response);
          if (response && response.status >= 400 && response.status < 600)
            throw Error(`${response.status}: ${response.statusText}`);
          break;
        } catch (error) {
          logger.error('Detected error', response, error);
          if (retry > 0) retry -= 1;
          else {
            if (response && response.status >= 400 && response.status < 600) {
              if (response.status === 404) {
                await cache.delete(request.url);
              }
              throw new FetchError(error, response);
            }
          }
        }
      }

      // if (response && response.status >= 400 && response.status < 600)
      //   throw Error(`${response.status}: ${response.statusText}`);
      response['cacheEntry'] = init.cacheEntry;
      response['cacheGroup'] = init.cacheGroup;
      response['cacheTTL'] = init.cacheTTL;
      await cache.put(request, response.clone());
      if (
        !oldResponse ||
        !deepEqual(await oldResponse.json(), await response.clone().json())
      ) {
        if (this.onCacheEntryUpdated && notifyUpdates)
          this.onCacheEntryUpdated(request, response.clone());
      } else {
        logger.debug(
          'Entry unchanged (not fetched)',
          url,
          init.cacheEntry,
          init.cacheGroup
        );
      }
    } else {
      logger.debug(`Cache hit for url ${url}`);
    }
    return response;
  }

  public async getEntries(cache?: Cache, fetchResponse: boolean = true) {
    const result: CacheEntriesMap = {
      requests: {},
      groups: {},
      namedEntries: {},
      createdAt: {},
    };
    cache = cache ?? (await caches.open(this._cacheName));
    for (const rq of await cache.keys()) {
      const request = await this.getCachedRequest(rq);
      const response = fetchResponse ? await cache.match(request.url) : null;
      // logger.debug('Cache response', rq, request, response);
      // response.headers.forEach((v) => logger.debug(v));
      result.createdAt[rq.url] =
        Number(request.headers?.get('cache-created-at')) ?? 0;
      if (response) {
        const entryName: string = request.headers?.get('cache-entry');

        response['cacheEntry'] = entryName;
        response['cacheGroup'] = request.headers?.get('cache-group');
        response['cacheTTL'] = Number(
          request.headers?.get('cache-ttl') ?? defaultCacheTTL
        );
        response['cacheCreatedAt'] = Number(
          request.headers?.get('cache-created-at') ?? getTimeStamp()
        );

        if (entryName) {
          result.namedEntries[entryName] = {
            request: request,
            response: response,
          };
        }
      }
      result.requests[request.url] = { request: request, response: response };
      if (request.cacheGroup) {
        const groupEntries = result.groups[request.cacheGroup] || [];
        if (!result.groups[request.cacheGroup])
          result.groups[request.cacheGroup] = groupEntries;
        groupEntries.push(request.url);
        const leastRecentGroupEntry = groupEntries.reduce((prev, next) => {
          const rp = result.requests[prev];
          const rn = result.requests[next];
          return rp.request.cacheCreatedAt < rn.request.cacheCreatedAt
            ? prev
            : next;
        });
        result.createdAt[request.cacheGroup] =
          result.requests[leastRecentGroupEntry].request.cacheCreatedAt;
      }
    }
    return result;
  }

  public async refreshEntryByKey(
    entryKey: string,
    options: {
      cache?: Cache;
      ignoreTTL?: boolean;
    } = {
      ignoreTTL: false,
    }
  ): Promise<{ request: CachedRequest; response: CachedResponse } | null> {
    const cache = options.cache ?? (await caches.open(this._cacheName));
    const request = await this.findCachedRequestByKey(entryKey, cache);
    if (request) {
      const response = await cache.match(request.url);
      logger.debug(`Refreshing cache entry ${entryKey} (url: ${request.url})`);
      return await this.refreshEntry(
        {
          request: request,
          response: response,
        },
        options
      );
    } else {
      logger.error(`Entry ${entryKey} not found`);
      return null;
    }
  }

  public async refreshEntry(
    entry: { request: CachedRequest; response: CachedResponse },
    options: {
      cache?: Cache;
      ignoreTTL?: boolean;
      notifyUpdates?: boolean;
    } = {
      ignoreTTL: false,
      notifyUpdates: false,
    }
  ): Promise<{ request: CachedRequest; response: CachedResponse }> {
    const request = entry.request;
    let response = entry.response;
    const isExpired = CacheManager.isExpired(entry.request);
    const ignoreTTL = options.ignoreTTL ?? false;
    logger.debug(`Check request expiration: expired? ${isExpired}`);
    if (!ignoreTTL && !isExpired) {
      logger.debug('TTL not expired for request', request);
      return;
    }

    const updateRequest = entry.request.clone
      ? entry.request.clone()
      : entry.request.request
      ? entry.request.request.clone()
      : entry.request;
    logger.debug('Check request-response', updateRequest, entry.response);
    updateRequest.headers.delete('cache-created-at');
    updateRequest.headers.append('cache-created-at', String(getTimeStamp()));

    const cache = options.cache ?? (await caches.open(this._cacheName));

    try {
      const updatedResponse = await fetch(
        updateRequest.clone ? updateRequest.clone() : updateRequest
      );
      await cache.put(
        updateRequest.clone ? updateRequest.clone() : updateRequest,
        updatedResponse.clone()
      );
      logger.debug('Check response', updatedResponse);
      if (
        updatedResponse &&
        updatedResponse.status >= 400 &&
        updatedResponse.status < 600
      )
        throw Error(`${updatedResponse.status}: ${updatedResponse.statusText}`);

      const dataOld = response ? await response.clone().json() : {};
      const dataNew = await updatedResponse.clone().json();

      logger.debug('Updated Request', updateRequest);
      logger.debug('Updated Response', updatedResponse);

      if (this.onCacheEntryUpdated && options.notifyUpdates) {
        logger.debug(
          'Comparing objects',
          dataOld,
          dataNew,
          deepEqual(dataOld, dataNew)
        );
        if (!deepEqual(dataOld, dataNew)) {
          this.onCacheEntryUpdated(updateRequest, response);
        } else {
          logger.debug('Entry unchanged (not refreshed)', request.url);
        }
      }
      return { request: updateRequest, response: updatedResponse.clone() };
    } catch (error) {
      logger.debug('Refresh entry failed', request.url);
      await cache.delete(request.url);
      logger.debug('Cache entry removed', request.url);
      return null;
    }
  }

  public async refresh(): Promise<{ [req: string]: Response }> {
    const result: { [req: string]: Response } = {};
    const cache = await caches.open(this._cacheName);
    const entriesMap = await this.getEntries();
    // logger.debug('Entries Map', entriesMap);
    const entries = { ...entriesMap.requests };
    const groups = entriesMap.groups;

    // Update grouped entries
    for (const groupKey of Object.keys(groups)) {
      const groupEntries: {
        [key: string]: { request: CachedRequest; response: CachedResponse };
      } = {};
      let groupUpdated: boolean = false;
      for (const entryKey of groups[groupKey]) {
        const entry: { request: CachedRequest; response: CachedResponse } =
          entries[entryKey];
        if (await this.refreshEntry(entry, { cache: cache }))
          groupUpdated = true;
        result[entryKey] = entry.response;
        delete entries[entryKey];
        groupEntries[entryKey] = entry;
      }
      if (groupUpdated) {
        logger.debug('Updated group', groupKey);
        if (this.onCacheEntriesGroupUpdated)
          this.onCacheEntriesGroupUpdated(groupKey, groupEntries);
      } else {
        logger.debug('Group not updated', groupKey);
      }
    }

    // Update remaining
    logger.debug('Remaining entries', entries);
    for (const entryKey of Object.keys(entries)) {
      const entry: { request: CachedRequest; response: CachedResponse } =
        entries[entryKey];
      await this.refreshEntry(entry, { cache: cache });
      result[entryKey] = entry.response;
      if (this.onCacheEntryUpdated)
        this.onCacheEntryUpdated(entry.request, entry.response.clone());
    }
    return result;
  }

  public async refreshCacheEntriesGroup(
    groupName: string,
    notifyEntryGroupUpdate: boolean = true
  ): Promise<boolean> {
    const cache = await caches.open(this._cacheName);
    const entriesMap = await this.getEntries(cache, true);
    const groupEntries = entriesMap.groups[groupName];
    const updatedEntries: {
      [key: string]: {
        request: CachedRequest;
        response: CachedResponse;
      };
    } = {};
    if (groupEntries) {
      logger.debug('Found group', groupEntries);
      for (let key of groupEntries) {
        logger.debug('Trying to update', key);
        const entry = entriesMap.requests[key];
        if (entry) {
          updatedEntries[key] = entry;
          // await cache.delete(entry.request.url);
          // logger.debug('Delete entry', entry);
          await this.refreshEntry(entry, {
            cache: cache,
            ignoreTTL: true,
            notifyUpdates: false,
          });
          logger.debug('Updated entry', entry);
        }
      }
      logger.debug('Updated group', groupName, groupEntries);
      if (this.onCacheEntriesGroupUpdated && notifyEntryGroupUpdate) {
        // if(self['alert']) self['alert']("Notifying");
        this.onCacheEntriesGroupUpdated(groupName, updatedEntries);
      }
      return true;
    } else {
      logger.debug(`Group ${groupName} not found`);
    }
    return false;
  }

  public async deleteCacheEntryByURL(url: string): Promise<boolean> {
    const cache = await caches.open(this._cacheName);
    const result = await cache.delete(url);
    logger.debug(`Cache entry ${url} deleted`);
    if (this.onCacheEntryDeleted) this.onCacheEntryDeleted(url);
    return result;
  }

  public async deleteCacheEntryByKey(key: string): Promise<boolean> {
    const cache = await caches.open(this._cacheName);
    const request = await this.findCachedRequestByKey(key, cache);
    if (request) {
      const result = await cache.delete(request.url);
      logger.debug(`Cache entry ${key} deleted (url: ${request.url})`);
      if (this.onCacheEntryDeleted) this.onCacheEntryDeleted(key);
      return result;
    } else return false;
  }

  public async deleteCacheEntriesGroup(
    groupName: string,
    notifyEntryDeletion: boolean = true
  ): Promise<boolean> {
    const cache = await caches.open(this._cacheName);
    const entriesMap = await this.getEntries(cache, false);
    const groupEntries = entriesMap.groups[groupName];
    if (groupEntries) {
      logger.debug('Found group', groupEntries);
      for (let key of groupEntries) {
        logger.debug('Trying to delete', key);
        const entry = entriesMap.requests[key];
        await cache.delete(entry.request.url);
        logger.debug('Delete entry', entry);
        if (notifyEntryDeletion && this.onCacheEntryDeleted)
          this.onCacheEntryDeleted(key);
      }
      logger.debug('Deleted group', groupName, groupEntries);
      if (notifyEntryDeletion && this.onCacheEntriesGroupDeleted)
        this.onCacheEntriesGroupDeleted(groupName, groupEntries);
      return true;
    } else {
      logger.debug(`Group ${groupName} not found`);
    }
    return false;
  }

  public async clear() {
    const cache = await caches.open(this._cacheName);
    const entries = await cache.keys();
    for (let entry of entries) {
      await cache.delete(entry);
    }
  }
}
