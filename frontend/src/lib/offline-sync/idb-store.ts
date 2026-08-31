import type { QueuedTellerOperation } from './types';

const DB_NAME = 'isms-teller-outbox';
const STORE = 'operations';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then((db) => {
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      const request = fn(store);
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    });
  });
}

export async function putOutboxItem(item: QueuedTellerOperation): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(item));
}

export async function getOutboxItem(id: string): Promise<QueuedTellerOperation | undefined> {
  return runTransaction('readonly', (store) => store.get(id));
}

export async function deleteOutboxItem(id: string): Promise<void> {
  await runTransaction('readwrite', (store) => store.delete(id));
}

export async function listOutboxItems(): Promise<QueuedTellerOperation[]> {
  const all = await runTransaction<QueuedTellerOperation[]>('readonly', (store) => store.getAll());
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listPendingOutboxItems(): Promise<QueuedTellerOperation[]> {
  const all = await listOutboxItems();
  return all.filter((item) => item.status === 'queued' || item.status === 'failed');
}
