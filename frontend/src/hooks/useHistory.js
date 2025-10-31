import { useState, useCallback, useRef } from 'react';

export const useHistory = (initialContent = '', onContentChange) => {
  const [history, setHistory] = useState([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUpdatingFromHistory, setIsUpdatingFromHistory] = useState(false);
  const lastLoadedPageRef = useRef(null);

  const addToHistory = useCallback(
    (newContent) => {
      if (isUpdatingFromHistory) return;

      setHistory((prev) => {
        // Remove any history after current index (for when user types after undo)
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newContent);

        // Limit history to 50 entries
        if (newHistory.length > 50) {
          newHistory.shift();
          return newHistory;
        }

        return newHistory;
      });

      setHistoryIndex((prev) => {
        const newIndex = prev + 1;
        // Adjust index if we limited history size
        return history.length >= 50 ? 49 : newIndex;
      });
    },
    [historyIndex, isUpdatingFromHistory, history.length]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUpdatingFromHistory(true);
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousContent = history[newIndex];

      if (onContentChange) {
        onContentChange(previousContent);
      }

      setTimeout(() => setIsUpdatingFromHistory(false), 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUpdatingFromHistory(true);
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextContent = history[newIndex];

      if (onContentChange) {
        onContentChange(nextContent);
      }

      setTimeout(() => setIsUpdatingFromHistory(false), 0);
    }
  };

  const resetHistory = (newContent, pageId) => {
    if (lastLoadedPageRef.current !== pageId) {
      setHistory([newContent]);
      setHistoryIndex(0);
      lastLoadedPageRef.current = pageId;
    }
  };

  return {
    history,
    historyIndex,
    isUpdatingFromHistory,
    addToHistory,
    handleUndo,
    handleRedo,
    resetHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
};
