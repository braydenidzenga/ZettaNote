import { useState, useEffect, useRef, useCallback } from "react";
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/pages/savepage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          pageId,
          newPageData: content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.message || "Failed to save page";
        setError(message);
        setIsSaving(false);
        setIsSaved(false);
        return { success: false, error: message };
      }

      setIsSaving(false);
      setIsSaved(true);
      return { success: true };
    } catch {
      const message = "Failed to save page";
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
