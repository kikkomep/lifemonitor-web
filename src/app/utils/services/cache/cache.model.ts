import { enc, SHA256 } from 'crypto-js';
import { Logger, LoggerManager } from '../../logging';

/** This Web Storage API interface provides access to a particular domain's session or local storage. It allows, for example, the addition, modification, or deletion of stored data items. */
interface Storage {
  /** Returns the number of key/value pairs. */
  readonly length: number;
  /**
   * Removes all key/value pairs, if there are any.
   *
   * Dispatches a storage event on Window objects holding an equivalent Storage object.
   */
  clear(): void;
  /** Returns the current value associated with the given key, or null if the given key does not exist. */
  getItem(key: string): string | null;
  /** Returns the name of the nth key, or null if n is greater than or equal to the number of key/value pairs. */
  key(index: number): string | null;
  /**
   * Removes the key/value pair with the given key, if a key/value pair with the given key exists.
   *
   * Dispatches a storage event on Window objects holding an equivalent Storage object.
   */
  removeItem(key: string): void;
  /**
   * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
   *
   * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
   *
   * Dispatches a storage event on Window objects holding an equivalent Storage object.
   */
  setItem(key: string, value: string): void;
  [name: string]: any;
}

class MemStorage implements Storage {
  _items = {};

  key(index: number): string | null {
    return null;
  }

  getItem(key: string): string | null {
    return this._items[key];
  }

  /** Returns the number of key/value pairs. */
  get length(): number {
    return Object.keys(this._items).length;
  }

  clear(): void {
    this._items = {};
  }

  removeItem(key: string): void {
    this._items[key] = null;
  }

  setItem(key: string, value: string): void {
    this._items[key] = value;
  }
}

function getStorage(): Storage {
  try {
    return self['localStorage'];
  } catch (e) {
    return new MemStorage();
  }
}

export interface RequestEntry {
  url: string;
  http_options?: object;
  userCacheKey?: string;
  headers?: object;
}

export interface ICacheEntry {
  key: string;
  request: RequestEntry;
  response: object;
  meta: object;
  created_at: number;
  valid: boolean;
}

export interface CacheEntryDTO {
  key: string;
  request: RequestEntry;
  response: object;
  created_at: number;
  valid: boolean;
  meta: object;
}

export class CacheEntry implements ICacheEntry {
  _key: string = null;
  request: RequestEntry;
  response: object;
  meta: object;
  created_at: number;
  valid: boolean;

  constructor(
    request: RequestEntry,
    response: object,
    options?: {
      meta?: object;
      valid?: boolean;
      create_at?: number;
    }
  ) {
    this.request = request;
    this.response = response;
    this.meta = options?.meta;
    this.valid = options?.valid ?? true;
    this.created_at = options.create_at ?? new Date().getTime();
  }

  public get key(): string {
    if (!this._key) {
      if (this.request.userCacheKey) this._key = this.request.userCacheKey;
      else this._key = CacheEntry.makeKey(this.request);
    }
    return this._key;
  }

  public save() {
    getStorage().setItem(
      this.key,
      JSON.stringify({
        key: this.key,
        request: this.request,
        response: this.response,
        created_at: this.created_at,
        valid: this.valid,
        meta: this.meta,
      })
    );
  }

  public delete() {
    getStorage().removeItem(this.key);
  }

  public invalidate(save: boolean = false) {
    this.valid = false;
    if (save) this.save();
  }

  public toJSON(): CacheEntryDTO {
    return {
      key: this.key,
      request: this.request,
      response: this.response,
      created_at: this.created_at,
      valid: this.valid,
      meta: this.meta,
    };
  }

  public static makeKey(request: RequestEntry): string {
    return SHA256(JSON.stringify(request)).toString(enc.Hex);
  }

  public static loadByKey(key: string): CacheEntry {
    const cacheValue = getStorage().getItem(key);
    if (!cacheValue) return null;
    const data = JSON.parse(cacheValue) as ICacheEntry;
    return new CacheEntry(data.request, data.response, {
      meta: data.meta,
      valid: data.valid,
      create_at: data.created_at,
    });
  }

  public static loadFromRequest(request: RequestEntry): CacheEntry {
    const key: string = this.makeKey(request);
    return this.loadByKey(key);
  }

  public static fromJSON(data: CacheEntryDTO): CacheEntry {
    return new CacheEntry(data.request, data.response, {
      meta: data.meta,
      valid: data.valid,
      create_at: data.created_at,
    });
  }
}

export class CacheGroup {
  map: CacheMap;
  meta: object;
  create_at: number;

  private _key: string;
  private _entries: { [key: string]: CacheEntry };

  // initialize logger
  // private logger: Logger;
  private logger = console;

  constructor(meta: object) {
    if (!meta) throw Error('meta cannot be null');
    this.meta = meta;
    this._entries = {};
    this.create_at = new Date().getTime();
    this.logger = console;
    // LoggerManager.create('MetaMapItem: ' + this.key);
  }

  public static makeKey(meta: object): string {
    return SHA256(JSON.stringify(meta)).toString(enc.Hex);
  }

  public get key(): string {
    if (!this._key) {
      this._key = CacheGroup.makeKey(this.meta);
    }
    return this._key;
  }

  public addEntry(e: CacheEntry): CacheEntry {
    this._entries[e.key] = e;
    return e;
  }

  public removeEntry(e: CacheEntry) {
    this._entries[e.key] = null;
  }

  public getEntriesKeys(): Array<string> {
    return Object.keys(this._entries);
  }

  public getEntries(): Array<CacheEntry> {
    return this.getEntriesKeys().map((k) => this._entries[k]);
  }

  public invalidateEntries(save: boolean = false) {
    this.getEntries().forEach((e) => {
      e.valid = false;
      if (save) e.save();
    });
  }

  public delete() {
    this.getEntries().forEach((e) => {
      this.removeEntry(e);
      e.delete();
    });
  }
}

export class CacheMap {
  // initialize logger
  private logger = console; //LoggerManager.create('MetaMapInstance');

  _groups: { [key: string]: CacheGroup } = {};

  _cacheIndexKey: string = 'cache-map';

  public getGroup(meta: object): CacheGroup {
    return this._groups[CacheGroup.makeKey(meta)];
  }

  public getGroupByKey(metaKey: string): CacheGroup {
    return this._groups[metaKey];
  }

  public addGroup(meta: object): CacheGroup {
    const itemKey = CacheGroup.makeKey(meta);
    let group: CacheGroup = this.getGroupByKey(itemKey);
    if (!group) {
      group = new CacheGroup(meta);
      group.map = this;
      this._groups[itemKey] = group;
    }
    return group;
  }

  public removeGroupByKey(metaKey: string) {
    this._groups[metaKey] = null;
  }

  public removeGroup(meta: object): CacheGroup {
    const key: string = CacheGroup.makeKey(meta);
    const group: CacheGroup = this.getGroupByKey(key);
    this._groups[key] = null;
    return group;
  }

  public getGroups(): CacheGroup[] {
    return Object.keys(this._groups).map((k) => this._groups[k]);
  }

  public getEntries(): CacheEntry[] {
    let result: CacheEntry[] = [];
    this.getGroups().forEach((g: CacheGroup) => {
      result = result.concat(g.getEntries());
    });
    return result;
  }

  public invalidateCacheEntriesByGroup(meta: object) {
    const group: CacheGroup = this.getGroup(meta);
    if (group) {
      group.getEntries().forEach((e) => {
        e.valid = false;
      });
    } else {
      this.logger.debug('Unable to find metaItem: ', meta);
    }
  }

  public loadEntryByKey(key: string): CacheEntry {
    const entry: CacheEntry = CacheEntry.loadByKey(key);
    if (entry) {
      this.addEntry(entry);
    }
    return entry;
  }

  public loadEntryByRequest(request: RequestEntry): CacheEntry {
    const entry: CacheEntry = CacheEntry.loadFromRequest(request);
    if (entry) {
      this.addEntry(entry);
    }
    return entry;
  }

  public addEntry(e: CacheEntry, save: boolean = false) {
    this.addGroup(e.meta).addEntry(e);
    if (save) {
      e.save();
      this.updateIndex();
    }
  }

  public removeEntry(e: CacheEntry, save: boolean = false) {
    const group: CacheGroup = this.getGroup(e.meta);
    if (group) {
      group.removeEntry(e);
    }
    if (save) {
      e.delete();
      this.updateIndex();
    }
  }

  public removeEntryByKey(key: string, save: boolean = false) {
    const e: CacheEntry = CacheEntry.loadByKey(key);
    if (!e) return;
    const group: CacheGroup = this.getGroup(e.meta);
    if (group) {
      group.removeEntry(e);
    }
    if (save) {
      e.delete();
      this.updateIndex();
    }
  }

  public removeEntryByRequest(request: RequestEntry, save: boolean = false) {
    const e: CacheEntry = CacheEntry.loadFromRequest(request);
    if (!e) return;
    const group: CacheGroup = this.getGroup(e.meta);
    if (group) {
      group.removeEntry(e);
    }
    if (save) {
      e.delete();
      this.updateIndex();
    }
  }

  public removeEntriesByGroup(meta: object) {
    const group: CacheGroup = this.getGroup(meta);
    if (group) {
      group.delete();
      this.updateIndex();
    }
  }

  public load() {
    const indexValue = getStorage().getItem(this._cacheIndexKey);
    if (indexValue) {
      const index: Array<string> = JSON.parse(indexValue);
      index.forEach((key) => {
        const entry: CacheEntry = CacheEntry.loadByKey(key);
        this.addGroup(entry.meta).addEntry(entry);
      });
    }
  }

  public getIndex(): Array<string> {
    const index = [];
    this.getEntries().forEach((e) => {
      index.push(e.key);
    });
    return index;
  }

  public updateIndex() {
    getStorage().setItem(this._cacheIndexKey, JSON.stringify(this.getIndex()));
  }

  public save() {
    const index = [];
    this.getEntries().forEach((e) => {
      e.save();
      index.push(e.key);
    });
    getStorage().setItem(this._cacheIndexKey, JSON.stringify(index));
  }

  public delete() {
    this.getEntries().forEach((e) => e.delete());
    getStorage().removeItem(this._cacheIndexKey);
  }

  public clear() {
    this._groups = {};
  }

  public toJSON(): { [key: string]: CacheEntryDTO } {
    const result = {};
    this.getEntries().forEach((e: CacheEntry) => {
      result[e.key] = e.toJSON();
    });
    return result;
  }

  public static fromJSON(data: { [key: string]: CacheEntryDTO }): CacheMap {
    const cacheMap = new CacheMap();
    Object.keys(data).forEach((key) => {
      const entry = CacheEntry.fromJSON(data[key]);
      cacheMap.addEntry(entry);
    });
    return cacheMap;
  }
}

export class CacheRefreshStatus {
  _requests: Array<string>;
  _processed: Array<string>;

  constructor(requests: Array<string>) {
    this._requests = requests;
    this._processed = [];
  }

  public getRequests(): Array<string> {
    return { ...this._requests };
  }

  public setProcessed(request: string, processed: boolean = true) {
    this._processed[request] = processed;
  }

  public isProcessed(request: string) {
    return this._processed[request];
  }

  public getProcessed(): Array<string> {
    return { ...this._processed };
  }

  public get completionStatus(): number {
    return Math.floor(
      (Object.keys(this._processed).length / this._requests.length) * 100
    );
  }

  public reset() {
    this._processed = [];
  }
}
