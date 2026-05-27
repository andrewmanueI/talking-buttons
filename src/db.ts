import { openDB, type IDBPDatabase } from 'idb';
import type { SoundButton, AppSettings, SavedPreset } from './types';

const DB_NAME = 'talking_buttons';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('buttons')) {
            db.createObjectStore('buttons', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('presets')) {
            db.createObjectStore('presets', { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllButtons(): Promise<SoundButton[]> {
  const db = await getDb();
  const buttons = await db.getAll('buttons');
  return buttons.sort((a, b) => a.order - b.order);
}

export async function addButton(button: SoundButton): Promise<void> {
  const db = await getDb();
  await db.add('buttons', button);
}

export async function updateButton(button: SoundButton): Promise<void> {
  const db = await getDb();
  await db.put('buttons', button);
}

export async function addButtons(buttons: SoundButton[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('buttons', 'readwrite');
  for (const btn of buttons) {
    await tx.store.put(btn);
  }
  await tx.done;
}

export async function deleteButton(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('buttons', id);
}

export async function deleteAllButtons(): Promise<void> {
  const db = await getDb();
  await db.clear('buttons');
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDb();
  const result = await db.get('settings', 'app');
  return result?.value ?? null;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDb();
  await db.put('settings', { key: 'app', value: settings });
}

export async function getAllPresets(): Promise<SavedPreset[]> {
  const db = await getDb();
  const presets = await db.getAll('presets');
  return presets.sort((a, b) => b.createdAt - a.createdAt);
}

export async function savePreset(preset: SavedPreset): Promise<void> {
  const db = await getDb();
  await db.put('presets', preset);
}

export async function deletePreset(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('presets', id);
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['buttons', 'settings', 'presets'], 'readwrite');
  await tx.objectStore('buttons').clear();
  await tx.objectStore('settings').clear();
  await tx.objectStore('presets').clear();
  await tx.done;
  dbPromise = null;
}
