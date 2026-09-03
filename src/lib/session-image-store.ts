export type SessionImageKey = "capturedImage" | "bgImage" | "finalImage";

const DATABASE_NAME = "dshs-ai-booth";
const STORE_NAME = "session-images";
const DATABASE_VERSION = 1;
const FALLBACK_PREFIX = "booth-image:";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("이 브라우저에서는 대용량 이미지 저장을 지원하지 않습니다."));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function setSessionImage(
  key: SessionImageKey,
  value: string,
): Promise<void> {
  try {
    await runTransaction("readwrite", (store) => store.put(value, key));
    sessionStorage.removeItem(`${FALLBACK_PREFIX}${key}`);
  } catch (error) {
    // Very old browsers can still use the previous storage path as a fallback.
    // A quota error is allowed to surface so the UI can show a recovery message.
    sessionStorage.setItem(`${FALLBACK_PREFIX}${key}`, value);
    console.warn("IndexedDB image storage unavailable; using sessionStorage", error);
  }
}

export async function getSessionImage(
  key: SessionImageKey,
): Promise<string | null> {
  try {
    const value = await runTransaction<string | undefined>("readonly", (store) =>
      store.get(key),
    );
    if (value) return value;
  } catch (error) {
    console.warn("IndexedDB image read unavailable; checking fallback", error);
  }

  return sessionStorage.getItem(`${FALLBACK_PREFIX}${key}`);
}

export async function removeSessionImage(key: SessionImageKey): Promise<void> {
  sessionStorage.removeItem(`${FALLBACK_PREFIX}${key}`);
  try {
    await runTransaction("readwrite", (store) => store.delete(key));
  } catch (error) {
    console.warn("Could not remove IndexedDB image", error);
  }
}

export async function clearSessionImages(): Promise<void> {
  (["capturedImage", "bgImage", "finalImage"] as SessionImageKey[]).forEach(
    (key) => sessionStorage.removeItem(`${FALLBACK_PREFIX}${key}`),
  );

  try {
    await runTransaction("readwrite", (store) => store.clear());
  } catch (error) {
    console.warn("Could not clear IndexedDB images", error);
  }
}
