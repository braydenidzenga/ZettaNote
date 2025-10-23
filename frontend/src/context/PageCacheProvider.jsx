import { createContext, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { pagesAPI } from '../utils/api';
import indexedDBCache from '../utils/indexedDBCache';
import backgroundSyncManager from '../utils/backgroundSyncManager';

// =============================================================================
// DEVELOPER NOTES
// =============================================================================
// PageCacheProvider manages page content caching and synchronization.
// Architecture:
// - In-memory cache for immediate access
// - IndexedDB for persistent storage across sessions
// - Background sync for offline/online transitions
// - Optimistic updates for better UX
//
// Cache hierarchy:
// 1. Memory cache (fastest, session-only)
// 2. IndexedDB (persistent, cross-session)
// 3. Server (authoritative source)
//
// Sync states: 'synced', 'syncing', 'error', 'cached', 'deleted'

// =============================================================================
// TODO
// =============================================================================
// - [ ] Implement cache invalidation strategies
// - [ ] Add cache size limits and LRU eviction
// - [ ] Improve conflict resolution for concurrent edits
// - [ ] Add cache compression for large content
// - [ ] Implement cache warming for frequently accessed pages
// - [ ] Add cache analytics and performance monitoring
// - [ ] Consider implementing cache versioning

const PageCacheContext = createContext();

export const PageCacheProvider = ({ children }) => {
  const [pageCache, setPageCache] = useState(new Map());
  const [preloadingPages, setPreloadingPages] = useState(new Set());
  const [syncStatus, setSyncStatus] = useState('synced'); // synced, syncing, error

  // Initialize cache from IndexedDB on mount
  useEffect(() => {
    const initializeCache = async () => {
      try {
        const cachedPages = await indexedDBCache.getAllPages();
        const cacheMap = new Map();

        cachedPages.forEach((page) => {
          cacheMap.set(page.id, {
            content: page.content,
            lastSaved: page.lastModified,
            timestamp: page.timestamp,
            syncStatus: page.syncStatus,
          });
        });

        setPageCache(cacheMap);
      } catch (error) {
        console.warn('Failed to initialize cache from IndexedDB:', error);
      }
    };

    initializeCache();

    // Listen for sync status changes
    const handleSyncStatusChange = (event) => {
      setSyncStatus(event.detail.status);
    };

    window.addEventListener('syncStatusChange', handleSyncStatusChange);

    return () => {
      window.removeEventListener('syncStatusChange', handleSyncStatusChange);
    };
  }, []);

  // Get cached page content
  const getCachedPage = useCallback(
    async (pageId) => {
      // First check in-memory cache
      const memoryCache = pageCache.get(pageId);
      if (memoryCache) {
        return memoryCache;
      }

      // Then check IndexedDB
      try {
        const dbPage = await indexedDBCache.getPage(pageId);
        if (dbPage) {
          const pageData = {
            content: dbPage.content,
            lastSaved: dbPage.lastModified,
            timestamp: dbPage.timestamp,
            syncStatus: dbPage.syncStatus,
          };

          // Update in-memory cache
          setPageCache((prev) => new Map(prev).set(pageId, pageData));

          return pageData;
        }
      } catch (error) {
        console.warn('Failed to get page from IndexedDB:', error);
      }

      return null;
    },
    [pageCache]
  );

  // Cache page content (instant local save)
  const setCachedPage = useCallback(async (pageId, content, lastSaved, syncStatus = 'cached') => {
    const pageData = {
      content,
      lastSaved: lastSaved || Date.now(),
      timestamp: Date.now(),
      syncStatus,
    };

    // Update in-memory cache immediately
    setPageCache((prev) => new Map(prev).set(pageId, pageData));

    // Save to IndexedDB for persistence
    try {
      await indexedDBCache.setPage(pageId, content, pageData.lastSaved, syncStatus);
    } catch (error) {
      console.warn('Failed to save page to IndexedDB:', error);
    }
  }, []);

  // Save page with background sync
  const savePage = useCallback(
    async (pageId, content) => {
      // Save to cache immediately (instant UI update)
      await setCachedPage(pageId, content, Date.now(), 'cached');

      // Queue for background sync to server
      try {
        await backgroundSyncManager.savePage(pageId, content);
      } catch (error) {
        console.warn('Failed to queue page for sync:', error);
        // Mark as error state
        await setCachedPage(pageId, content, Date.now(), 'error');
      }

      // Return immediately - UI is already updated
      return { success: true, cached: true };
    },
    [setCachedPage]
  );

  // Rename page with background sync
  const renamePage = useCallback(
    async (pageId, title) => {
      // Get current page data
      const currentPage = await getCachedPage(pageId);
      if (currentPage) {
        // Update cache immediately
        await setCachedPage(pageId, currentPage.content, Date.now(), 'cached');
      }

      // Queue for background sync
      try {
        await backgroundSyncManager.renamePage(pageId, title);
      } catch (error) {
        console.warn('Failed to queue page rename for sync:', error);
      }

      return { success: true, cached: true };
    },
    [getCachedPage, setCachedPage]
  );

  // Delete page with background sync
  const deletePage = useCallback(
    async (pageId) => {
      // Mark as deleted in cache immediately
      await setCachedPage(pageId, '', Date.now(), 'deleted');

      // Queue for background sync
      try {
        await backgroundSyncManager.deletePage(pageId);
      } catch (error) {
        console.warn('Failed to queue page deletion for sync:', error);
      }

      return { success: true, cached: true };
    },
    [setCachedPage]
  );

  // Check if page is being preloaded
  const isPreloading = useCallback(
    (pageId) => {
      return preloadingPages.has(pageId);
    },
    [preloadingPages]
  );

  // Preload page content with debouncing
  const preloadPage = useCallback(
    async (pageId, delay = 300) => {
      if (!pageId || pageCache.has(pageId) || preloadingPages.has(pageId)) {
        return;
      }

      // Add to preloading set
      setPreloadingPages((prev) => new Set(prev).add(pageId));

      // Debounce the preload request
      const timeoutId = setTimeout(async () => {
        try {
          // Check IndexedDB first
          const cachedPage = await indexedDBCache.getPage(pageId);
          if (cachedPage) {
            await setCachedPage(
              pageId,
              cachedPage.content,
              cachedPage.lastModified,
              cachedPage.syncStatus
            );
          } else {
            // Fetch from server if not in cache
            const response = await pagesAPI.getPage(pageId);

            if (response.data && response.data.Page) {
              await setCachedPage(
                pageId,
                response.data.Page.pageData || '',
                response.data.Page.updatedAt,
                'synced'
              );
            }
          }
        } catch (error) {
          console.warn(`Failed to preload page ${pageId}:`, error);
        } finally {
          // Remove from preloading set
          setPreloadingPages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(pageId);
            return newSet;
          });
        }
      }, delay);

      // Return cleanup function
      return () => {
        clearTimeout(timeoutId);
        setPreloadingPages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(pageId);
          return newSet;
        });
      };
    },
    [pageCache, preloadingPages, setCachedPage]
  );

  // Clear cache for a specific page
  const clearPageCache = useCallback((pageId) => {
    setPageCache((prev) => {
      const newCache = new Map(prev);
      newCache.delete(pageId);
      return newCache;
    });
  }, []);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    setPageCache(new Map());
    setPreloadingPages(new Set());
  }, []);

  // Get cache stats for debugging
  const getCacheStats = useCallback(() => {
    return {
      cachedPages: pageCache.size,
      preloadingPages: preloadingPages.size,
      syncStatus,
      isOnline: navigator.onLine,
      cacheEntries: Array.from(pageCache.entries()).map(([id, data]) => ({
        id,
        age: Date.now() - data.timestamp,
        contentLength: data.content.length,
        syncStatus: data.syncStatus,
      })),
    };
  }, [pageCache, preloadingPages, syncStatus]);

  // Force sync all pending changes
  const forceSync = useCallback(async () => {
    await backgroundSyncManager.forceSync();
  }, []);

  const value = {
    getCachedPage,
    setCachedPage,
    savePage,
    renamePage,
    deletePage,
    preloadPage,
    clearPageCache,
    clearAllCache,
    isPreloading,
    getCacheStats,
    forceSync,
    syncStatus,
  };

  return <PageCacheContext.Provider value={value}>{children}</PageCacheContext.Provider>;
};

PageCacheProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PageCacheContext;
