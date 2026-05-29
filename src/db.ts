import { openDB, type IDBPDatabase } from 'idb';
import type { SoundButton, AppSettings, SavedPreset, ExportData, AudioBlobData } from './types';

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

// ── Export / Import ──────────────────────────────────────────────

async function blobToBase64(blob: Blob): Promise<AudioBlobData> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return { type: blob.type, data: btoa(binary) };
}

function base64ToBlob(data: AudioBlobData): Blob {
  const binary = atob(data.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: data.type });
}

async function serializeAudio(btn: { audioBlob?: Blob }): Promise<{ audioBlob?: AudioBlobData }> {
  if (!btn.audioBlob) return {};
  return { audioBlob: await blobToBase64(btn.audioBlob) };
}

export async function exportAllData(): Promise<ExportData> {
  const [buttons, settingsRow, presets] = await Promise.all([
    getAllButtons(),
    getDb().then(db => db.get('settings', 'app')),
    getAllPresets(),
  ]);

  const serializedButtons = await Promise.all(
    buttons.map(async btn => {
      const { audioBlob, ...rest } = btn;
      const audio = await serializeAudio(btn);
      return { ...rest, ...audio };
    })
  );

  const serializedPresets = await Promise.all(
    presets.map(async preset => {
      const serializedPresetButtons = await Promise.all(
        preset.buttons.map(async pb => {
          const { audioBlob, ...rest } = pb;
          const audio = await serializeAudio(pb);
          return { ...rest, ...audio };
        })
      );
      return { ...preset, buttons: serializedPresetButtons };
    })
  );

  let language: 'id' | 'en' = 'id';
  try {
    const stored = localStorage.getItem('tb_lang');
    if (stored === 'id' || stored === 'en') language = stored;
  } catch {}

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      buttons: serializedButtons as ExportData['data']['buttons'],
      settings: settingsRow?.value ?? null,
      presets: serializedPresets as ExportData['data']['presets'],
      language,
    },
  };
}

export async function importAllData(data: ExportData): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['buttons', 'settings', 'presets'], 'readwrite');

  // Clear existing data
  await tx.objectStore('buttons').clear();
  await tx.objectStore('settings').clear();
  await tx.objectStore('presets').clear();

  // Restore buttons — convert base64 blobs back to Blob
  for (const btn of data.data.buttons) {
    const toStore: SoundButton = {
      ...btn,
      audioBlob: btn.audioBlob ? base64ToBlob(btn.audioBlob) : undefined,
    };
    await tx.objectStore('buttons').put(toStore);
  }

  // Restore settings
  if (data.data.settings) {
    await tx.objectStore('settings').put({ key: 'app', value: data.data.settings });
  }

  // Restore presets
  for (const preset of data.data.presets) {
    const toStore: SavedPreset = {
      ...preset,
      buttons: preset.buttons.map(pb => ({
        ...pb,
        audioBlob: pb.audioBlob ? base64ToBlob(pb.audioBlob) : undefined,
      })),
    };
    await tx.objectStore('presets').put(toStore);
  }

  await tx.done;

  // Restore language
  try {
    localStorage.setItem('tb_lang', data.data.language);
  } catch {}
}
