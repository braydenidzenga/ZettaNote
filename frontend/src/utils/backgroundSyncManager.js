// Background sync manager for handling offline operations
import indexedDBCache from './indexedDBCache';
import { pagesAPI } from './api';

class BackgroundSyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Register background sync if supported
    this.registerBackgroundSync();

    // Process any pending sync items on startup
    this.processSyncQueue();
  }

  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
  }

  async savePage(pageId, content) {
    // Add to sync queue
    await indexedDBCache.addToSyncQueue('save', pageId, { content });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return { success: true, queued: true };
  }

  async renamePage(pageId, newName) {
    // Add to sync queue
    await indexedDBCache.addToSyncQueue('rename', pageId, { newName });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return { success: true, queued: true };
  }

  async deletePage(pageId) {
    // Add to sync queue
    await indexedDBCache.addToSyncQueue('delete', pageId, {});

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return { success: true, queued: true };
  }

  async processSyncQueue() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const syncQueue = await indexedDBCache.getSyncQueue();

      for (const item of syncQueue) {
        await this.processSyncItem(item);
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncItem(item) {
    try {
      let success = false;

      switch (item.type) {
        case 'save':
          success = await this.syncSavePage(item);
          break;
        case 'rename':
          success = await this.syncRenamePage(item);
          break;
        case 'delete':
          success = await this.syncDeletePage(item);
          break;
      }

      if (success) {
        // Remove from sync queue
        await indexedDBCache.removeFromSyncQueue(item.id);
      } else {
        // Increment retry count
        const newRetryCount = (item.retryCount || 0) + 1;

        if (newRetryCount >= this.maxRetries) {
          // Mark as failed and remove from queue
          console.warn(`Sync item ${item.id} failed after ${this.maxRetries} retries`);
          await indexedDBCache.removeFromSyncQueue(item.id);
        } else {
          // Update retry count and schedule retry
          await indexedDBCache.updateSyncQueueItem(item.id, { retryCount: newRetryCount });
          setTimeout(() => this.processSyncQueue(), this.retryDelay * newRetryCount);
        }
      }
    } catch (error) {
      console.error(`Error processing sync item ${item.id}:`, error);
    }
  }

  async syncSavePage(item) {
    try {
      const response = await pagesAPI.savePage(item.pageId, item.data.content);

      if (response.status === 200 || response.status === 201) {
        // Update cache with synced status
        await indexedDBCache.setPage(item.pageId, item.data.content, Date.now(), 'synced');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error syncing save page:', error);
      return false;
    }
  }

  async syncRenamePage(item) {
    try {
      const response = await pagesAPI.renamePage(item.pageId, item.data.newName);

      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error('Error syncing rename page:', error);
      return false;
    }
  }

  async syncDeletePage(item) {
    try {
      const response = await pagesAPI.deletePage(item.pageId);

      if (response.status === 200 || response.status === 204) {
        // Remove from cache
        await indexedDBCache.deletePage(item.pageId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error syncing delete page:', error);
      return false;
    }
  }

  async forceSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    await this.processSyncQueue();
  }

  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }
}

const backgroundSyncManager = new BackgroundSyncManager();
export default backgroundSyncManager;
