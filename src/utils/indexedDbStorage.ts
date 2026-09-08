const DB_NAME = 'memenator_storage_v1';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';
const KV_STORE = 'kv';

interface StoredImageRecord {
  key: string;
  dataUrl: string;
  updatedAt: number;
}

interface StoredValueRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this browser.'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(KV_STORE)) {
        db.createObjectStore(KV_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB.'));
    };
    request.onblocked = () => {
      console.warn('MEMENATOR IndexedDB upgrade is blocked by another open tab.');
    };
  });

  return dbPromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
  });
}

export async function putLargeImage(key: string, dataUrl: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(IMAGE_STORE, 'readwrite');
  const record: StoredImageRecord = { key, dataUrl, updatedAt: Date.now() };
  tx.objectStore(IMAGE_STORE).put(record);
  await transactionDone(tx);
}

export async function getLargeImage(key: string): Promise<string | null> {
  const db = await openDatabase();
  const tx = db.transaction(IMAGE_STORE, 'readonly');
  const record = await requestResult<StoredImageRecord | undefined>(
    tx.objectStore(IMAGE_STORE).get(key)
  );
  return record?.dataUrl || null;
}

export async function deleteLargeImage(key: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(IMAGE_STORE, 'readwrite');
  tx.objectStore(IMAGE_STORE).delete(key);
  await transactionDone(tx);
}

export async function deleteLargeImagesByPrefix(prefix: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(IMAGE_STORE, 'readwrite');
  const store = tx.objectStore(IMAGE_STORE);

  await new Promise<void>((resolve, reject) => {
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) {
        resolve();
        return;
      }
      const key = String(cursor.key);
      if (key.startsWith(prefix)) cursor.delete();
      cursor.continue();
    };
    cursorRequest.onerror = () => reject(cursorRequest.error || new Error('Failed to scan IndexedDB images.'));
  });

  await transactionDone(tx);
}

export async function putIndexedValue<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(KV_STORE, 'readwrite');
  const record: StoredValueRecord<T> = { key, value, updatedAt: Date.now() };
  tx.objectStore(KV_STORE).put(record);
  await transactionDone(tx);
}

export async function getIndexedValue<T>(key: string): Promise<T | null> {
  const db = await openDatabase();
  const tx = db.transaction(KV_STORE, 'readonly');
  const record = await requestResult<StoredValueRecord<T> | undefined>(tx.objectStore(KV_STORE).get(key));
  return record?.value ?? null;
}

export async function deleteIndexedValue(key: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(KV_STORE, 'readwrite');
  tx.objectStore(KV_STORE).delete(key);
  await transactionDone(tx);
}
