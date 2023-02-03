import { IDBPDatabase, openDB } from 'idb';

export class IndexedDb {
  private database: string;
  private db: any;

  constructor(database: string) {
    this.database = database;
  }

  public async createObjectStore(objectStoreNames: string[]) {
    try {
      this.db = await openDB(this.database, 1, {
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
    } catch (error) {
      return false;
    }
  }

  public async getValue(objectStoreName: string, id: string) {
    const tx = this.db.transaction(objectStoreName, 'readonly');
    const store = tx.objectStore(objectStoreName);
    const result = await store.get(id);
    console.log('Get Data ', JSON.stringify(result));
    return result;
  }

  public async getAllValue(objectStoreName: string) {
    const tx = this.db.transaction(objectStoreName, 'readonly');
    const store = tx.objectStore(objectStoreName);
    const result = await store.getAll();
    console.log('Get All Data', JSON.stringify(result));
    return result;
  }

  public async putValue(objectStoreName: string, value: object) {
    const tx = this.db.transaction(objectStoreName, 'readwrite');
    const store = tx.objectStore(objectStoreName);
    const result = await store.put(value);
    console.log('Put Data ', JSON.stringify(result));
    return result;
  }

  public async putBulkValue(objectStoreName: string, values: object[]) {
    const tx = this.db.transaction(objectStoreName, 'readwrite');
    const store = tx.objectStore(objectStoreName);
    for (const value of values) {
      const result = await store.put(value);
      console.log('Put Bulk Data ', JSON.stringify(result));
    }
    return this.getAllValue(objectStoreName);
  }

  public async deleteValue(objectStoreName: string, id: string) {
    const tx = this.db.transaction(objectStoreName, 'readwrite');
    const store = tx.objectStore(objectStoreName);
    const result = await store.get(id);
    if (!result) {
      console.log('Id not found', id);
      return result;
    }
    await store.delete(id);
    console.log('Deleted Data', id);
    return id;
  }
}

export default IndexedDb;
