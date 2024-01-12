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

import { IDBPDatabase, openDB } from 'idb';
import { Logger, LoggerManager } from '../logging';

export class IndexedDb {
  private database: string;

  private logger: Logger = LoggerManager.create('IndexedDB');

  constructor(database: string) {
    this.database = database;
  }

  public async createObjectStore(
    objectStoreNames: string[]
  ): Promise<IDBPDatabase> {
    return await openDB(this.database, 1, {
      upgrade(db: IDBPDatabase) {
        for (const objectStoreName of objectStoreNames) {
          if (db.objectStoreNames.contains(objectStoreName)) {
            continue;
          }
          db.createObjectStore(objectStoreName, {
            //   autoIncrement: true,
            keyPath: 'type',
          });
        }
      },
    });
  }

  public async getDB(objectStoreName: string): Promise<IDBPDatabase> {
    return await this.createObjectStore([objectStoreName]);
  }

  public async getValue(objectStoreName: string, id: string) {
    const tx = (await this.getDB(objectStoreName)).transaction(
      objectStoreName,
      'readonly'
    );
    const store = tx.objectStore(objectStoreName);
    const result = await store.get(id);
    this.logger.debug('Get Data ', JSON.stringify(result));
    return result;
  }

  public async getAllValue(objectStoreName: string) {
    const tx = (await this.getDB(objectStoreName)).transaction(
      objectStoreName,
      'readonly'
    );
    const store = tx.objectStore(objectStoreName);
    const result = await store.getAll();
    this.logger.debug('Get All Data', JSON.stringify(result));
    return result;
  }

  public async putValue(objectStoreName: string, value: object) {
    const tx = (await this.getDB(objectStoreName)).transaction(
      objectStoreName,
      'readwrite'
    );
    const store = tx.objectStore(objectStoreName);
    const result = await store.put(value);
    this.logger.debug('Put Data ', JSON.stringify(result));
    return result;
  }

  public async putBulkValue(objectStoreName: string, values: object[]) {
    const tx = (await this.getDB(objectStoreName)).transaction(
      objectStoreName,
      'readwrite'
    );
    const store = tx.objectStore(objectStoreName);
    for (const value of values) {
      const result = await store.put(value);
      this.logger.debug('Put Bulk Data ', JSON.stringify(result));
    }
    return this.getAllValue(objectStoreName);
  }

  public async deleteValue(objectStoreName: string, id: string) {
    const tx = (await this.getDB(objectStoreName)).transaction(
      objectStoreName,
      'readwrite'
    );
    const store = tx.objectStore(objectStoreName);
    const result = await store.get(id);
    if (!result) {
      this.logger.debug('Id not found', id);
      return result;
    }
    await store.delete(id);
    this.logger.debug('Deleted Data', id);
    return id;
  }
}

export default IndexedDb;
