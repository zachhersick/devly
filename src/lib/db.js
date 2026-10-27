// On-device storage (IndexedDB). Every record lives in `records`, keyed by id.
const NAME = "devly";
const VERSION = 1;

let opening = null;
let memory = null; // used when IndexedDB is unavailable (some private modes)

function open() {
  if (!opening) {
    opening = new Promise((resolve) => {
      let request;
      try {
        request = indexedDB.open(NAME, VERSION);
      } catch {
        return resolve(null);
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("records")) db.createObjectStore("records", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    }).then((db) => {
      if (!db) memory = new Map();
      return db;
    });
  }
  return opening;
}

export const persistent = async () => Boolean(await open());

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function loadRecords() {
  const db = await open();
  if (!db) return [...memory.values()];
  return new Promise((resolve, reject) => {
    const request = db.transaction("records").objectStore("records").getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function putRecords(records) {
  if (!records.length) return;
  const db = await open();
  if (!db) return void records.forEach((record) => memory.set(record.id, record));
  const tx = db.transaction("records", "readwrite");
  for (const record of records) tx.objectStore("records").put(record);
  return done(tx);
}

export async function clearRecords() {
  const db = await open();
  if (!db) return void memory.clear();
  const tx = db.transaction("records", "readwrite");
  tx.objectStore("records").clear();
  return done(tx);
}
