import { useState, useEffect, useRef, useCallback } from "react";
import axios from 'axios';
import { API_URL } from "../config"; // adjust import path as needed

export function useSavePageOnChange(delay = 800) {
  const [saveError, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const timeoutRef = useRef(null);

  const savePage = useCallback(async ({ pageId, content }) => {
    setError("");
    setIsSaving(true);
    setIsSaved(false);

    try {
      const res = await axios.post(`${API_URL}/api/pages/savepage`, {
        pageId,
        newPageData: content,
      }, {
        withCredentials: true
      });

      setIsSaving(false);
      setIsSaved(true);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to save page";
      setError(message);
      setIsSaving(false);
      setIsSaved(false);
      return { success: false, error: message };
    }
  }, []);

  const debouncedSavePage = useCallback(
    ({ pageId, content }) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise((resolve) => {
        timeoutRef.current = setTimeout(async () => {
          const result = await savePage({ pageId, content });
          resolve(result);
        }, delay);
      });
    },
    [savePage, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { savePage: debouncedSavePage, saveError, isSaving, isSaved };
}
