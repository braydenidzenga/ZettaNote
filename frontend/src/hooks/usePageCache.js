import { useContext } from 'react';
import PageCacheContext from '../context/PageCacheProvider';

export const usePageCache = () => {
  const context = useContext(PageCacheContext);
  if (!context) {
    throw new Error('usePageCache must be used within a PageCacheProvider');
  }
  return context;
};
