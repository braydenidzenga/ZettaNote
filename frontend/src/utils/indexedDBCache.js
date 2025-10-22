// IndexedDB wrapper for caching page data
class IndexedDBCache {
  constructor() {
    this.dbName = 'ZettaNoteCache';
    this.version = 1;
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create pages store
        if (!db.objectStoreNames.contains('pages')) {
          const pagesStore = db.createObjectStore('pages', { keyPath: 'id' });
          pagesStore.createIndex('lastModified', 'lastModified', { unique: false });
          pagesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('pageId', 'pageId', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.initPromise;
    }
  }

  // Page operations
  async setPage(pageId, content, lastModified, syncStatus = 'cached') {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pages'], 'readwrite');
      const store = transaction.objectStore('pages');

      const pageData = {
        id: pageId,
        content,
        lastModified: lastModified || Date.now(),
        syncStatus,
        timestamp: Date.now(),
      };

      const request = store.put(pageData);

      request.onsuccess = () => resolve(pageData);
      request.onerror = () => reject(request.error);
    });
  }

  async getPage(pageId) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pages'], 'readonly');
      const store = transaction.objectStore('pages');
      const request = store.get(pageId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPages() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pages'], 'readonly');
      const store = transaction.objectStore('pages');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePage(pageId) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pages'], 'readwrite');
      const store = transaction.objectStore('pages');
      const request = store.delete(pageId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue operations
  async addToSyncQueue(type, pageId, data) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      const syncItem = {
        type, // 'save', 'rename', 'delete'
        pageId,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const request = store.add(syncItem);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(id, updates) {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const updatedItem = { ...item, ...updates };
          const putRequest = store.put(updatedItem);
          putRequest.onsuccess = () => resolve(updatedItem);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Sync queue item not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Clear all data
  async clear() {
    await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pages', 'syncQueue'], 'readwrite');

      const clearPages = transaction.objectStore('pages').clear();
      const clearSync = transaction.objectStore('syncQueue').clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };

      clearPages.onsuccess = checkComplete;
      clearSync.onsuccess = checkComplete;

      clearPages.onerror = () => reject(clearPages.error);
      clearSync.onerror = () => reject(clearSync.error);
    });
  }
}

const indexedDBCache = new IndexedDBCache();
export default indexedDBCache;
