import { Dexie } from 'dexie';

import { DexieDb } from '../global';

export const initDb = (): Dexie => {
  const db = new Dexie('MagritProjectDb');
  db.version(5).stores({
    projects: '++id, date, data',
  });
  return db;
};

export const storeProject = (db: DexieDb, dataObj: object): Promise<number> => db.projects.add({
  date: new Date(),
  data: JSON.parse(JSON.stringify(dataObj)),
});
