import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { VITE_API_URL } from '../env';

const PageCacheContext = createContext();

export const usePageCache = () => {
  const context = useContext(PageCacheContext);
  if (!context) {
    throw new Error('usePageCache must be used within a PageCacheProvider');
  }
  return context;
};

export const PageCacheProvider = ({ children }) => {
  const [pageCache, setPageCache] = useState(new Map());
  const [preloadingPages, setPreloadingPages] = useState(new Set());

  // Get cached page content
  const getCachedPage = useCallback(
    (pageId) => {
      return pageCache.get(pageId);
    },
    [pageCache]
  );

  // Cache page content
  const setCachedPage = useCallback((pageId, content, lastSaved) => {
    setPageCache((prev) =>
      new Map(prev).set(pageId, { content, lastSaved, timestamp: Date.now() })
    );
  }, []);

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
          const response = await axios.post(
            `${VITE_API_URL}/api/pages/getpage`,
            { pageId },
            { withCredentials: true }
          );

          if (response.data.Page) {
            setCachedPage(pageId, response.data.Page.pageData || '', response.data.Page.updatedAt);
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

  // Clear cache for a specific page (useful when page is updated)
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
      cacheEntries: Array.from(pageCache.entries()).map(([id, data]) => ({
        id,
        age: Date.now() - data.timestamp,
        contentLength: data.content.length,
      })),
    };
  }, [pageCache, preloadingPages]);

  const value = {
    getCachedPage,
    setCachedPage,
    preloadPage,
    clearPageCache,
    clearAllCache,
    isPreloading,
    getCacheStats,
  };

  return <PageCacheContext.Provider value={value}>{children}</PageCacheContext.Provider>;
};

PageCacheProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
