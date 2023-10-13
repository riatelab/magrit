import { Dexie } from 'dexie';

export const initDb = (): Dexie => {
  const db = new Dexie('MagritProjectDb');
  db.version(2).stores({
    projects: '++id, date, data',
  });
  return db;
};

export const storeProject = (db: Dexie, dataObj: object): Promise<number> => db.projects.add({
  date: new Date(),
  data: JSON.parse(JSON.stringify(dataObj)),
});
