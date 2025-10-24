import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import Note from '../components/dashboard/Note';
import Reminder from '../components/dashboard/Reminder';
import authContext from '../context/AuthProvider';
import { usePageCache } from '../hooks/usePageCache.js';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { authAPI, pagesAPI } from '../utils/api';

// =============================================================================
// DEVELOPER NOTES
// =============================================================================
// Main dashboard component handling page editing and management.
// Key features:
// - Auto-save functionality (1 second after typing stops)
// - Page caching with IndexedDB and localStorage fallback
// - OAuth callback handling for social logins
// - Real-time save status indicators
// - Responsive sidebar management
// - Unsaved changes protection on page unload

// Performance considerations:
// - Debounced auto-save to prevent excessive API calls
// - Optimistic UI updates with background sync
// - AbortController for cancelling pending requests
// - Memory cleanup on component unmount

// =============================================================================
// TODO
// =============================================================================
// - [ ] Add collaborative editing features (real-time updates)
// - [ ] Implement page versioning/history
// - [ ] Add keyboard shortcuts for common actions
// - [ ] Improve offline support and conflict resolution
// - [ ] Add page templates and quick-start options
// - [ ] Implement search within page content
// - [ ] Add page export functionality (PDF, Markdown, etc.)
// - [ ] Consider implementing page locking for concurrent edits

const Dashboard = () => {
  const { user, setuser } = useContext(authContext);
  const { getCachedPage, setCachedPage } = usePageCache();
  const [activePage, setActivePage] = useState(null);
  const [pageContent, setPageContent] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('synced'); // 'synced', 'cached', 'saving', 'error', 'unsaved'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRemindersSidebarOpen, setIsRemindersSidebarOpen] = useState(false);
  const saveAbortControllerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle OAuth success - fetch user data
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthSuccess = params.get('oauth');

    if (oauthSuccess === 'success' && !user) {
      // Fetch user data from backend using the cookie
      const fetchUserData = async () => {
        try {
          const response = await authAPI.getUser();

          if (response.data.user) {
            setuser(response.data.user);
            localStorage.setItem('zetta_user', JSON.stringify(response.data.user));
            toast.success('Successfully logged in!');
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          toast.error('Failed to complete login. Please try again.');
          navigate('/login', { replace: true });
        }
      };

      fetchUserData();
    }
  }, [location, navigate, user, setuser]);

  const handleUnauthorized = useCallback(
    (error) => {
      if (error.response && error.response.status === 401) {
        setuser(null);
        localStorage.removeItem('zetta_user');
        toast.error('Session expired. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        return true;
      }
      return false;
    },
    [setuser, navigate]
  );

  const loadPageContent = useCallback(
    async (pageId) => {
      try {
        // Check if page content is already cached
        const cachedPage = await getCachedPage(pageId);
        if (cachedPage) {
          setPageContent(cachedPage.content);
          setLastSaved(cachedPage.lastSaved);
          setSaveStatus('synced');
          return;
        }

        // Check for unsaved changes in localStorage
        const unsavedData = localStorage.getItem(`unsaved_page_${pageId}`);
        if (unsavedData) {
          try {
            const parsed = JSON.parse(unsavedData);
            // Only restore if it's recent (within last 24 hours)
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              setPageContent(parsed.content);
              setLastSaved(new Date(parsed.timestamp).toISOString());
              setSaveStatus('cached');
              toast.info('Restored unsaved changes');
              return;
            } else {
              // Remove old unsaved data
              localStorage.removeItem(`unsaved_page_${pageId}`);
            }
          } catch {
            // Invalid data, remove it
            localStorage.removeItem(`unsaved_page_${pageId}`);
          }
        }

        // If not cached and no unsaved changes, fetch from server
        const response = await pagesAPI.getPage(pageId);

        if (response.data.Page) {
          const content = response.data.Page.pageData || '';
          const lastSavedTime = response.data.Page.updatedAt;

          setPageContent(content);
          setLastSaved(lastSavedTime);
          setSaveStatus('synced');

          // Cache the loaded content
          setCachedPage(pageId, content, lastSavedTime);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          handleUnauthorized(error);
          return;
        }
        toast.error('Failed to load page content');
        console.error('Error loading page:', error);
      }
    },
    [handleUnauthorized, getCachedPage, setCachedPage]
  );

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (saveAbortControllerRef.current) {
        saveAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Cancel any pending save when switching pages
  useEffect(() => {
    if (saveAbortControllerRef.current) {
      saveAbortControllerRef.current.abort();
      saveAbortControllerRef.current = null;
    }
  }, [activePage?.id]);

  useEffect(() => {
    if (activePage?.id) {
      loadPageContent(activePage.id);
    } else {
      setPageContent('');
    }
  }, [activePage, loadPageContent]);

  // Handle beforeunload to save pending changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Check if there are unsaved changes
      const unsavedData = localStorage.getItem(`unsaved_page_${activePage?.id}`);
      if (unsavedData && saveStatus === 'cached') {
        // Cancel the unload and show a warning
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activePage?.id, saveStatus]);

  const handleContentChange = (newContent) => {
    setPageContent(newContent);
    setSaveStatus('cached');

    // Immediately update cache with new content (optimistic update)
    if (activePage?.id) {
      setCachedPage(activePage.id, newContent, new Date().toISOString());

      // Save unsaved changes to localStorage for persistence across reloads
      const unsavedData = {
        content: newContent,
        timestamp: Date.now(),
        pageId: activePage.id,
        pageName: activePage.name,
      };
      localStorage.setItem(`unsaved_page_${activePage.id}`, JSON.stringify(unsavedData));
    }

    // Clear existing timeout
    clearTimeout(window.autoSaveTimeout);

    // Set new timeout for background save (reduced to 1 second for better responsiveness)
    window.autoSaveTimeout = setTimeout(() => {
      handleSave(newContent);
    }, 1000);
  };

  const handleSave = async (content = pageContent) => {
    if (!activePage?.id) return;

    // Cancel any previous save request
    if (saveAbortControllerRef.current) {
      saveAbortControllerRef.current.abort();
    }

    // Don't save if already saving
    if (saveStatus === 'saving') return;

    const saveStartTime = Date.now();
    setSaveStatus('saving');

    // Create new AbortController for this request
    saveAbortControllerRef.current = new AbortController();

    try {
      // Direct server call for save
      const response = await pagesAPI.savePage(activePage.id, content);

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        const serverTimestamp = new Date().toISOString();
        setLastSaved(serverTimestamp);
        setSaveStatus('synced');

        // Update cache with server timestamp
        setCachedPage(activePage.id, content, serverTimestamp);

        // Remove unsaved changes from localStorage since they're now saved
        localStorage.removeItem(`unsaved_page_${activePage.id}`);

        // Only show success toast if save took more than 500ms (avoid spam for fast saves)
        if (Date.now() - saveStartTime > 500) {
          toast.success('Page saved successfully!');
        }
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      // Don't handle errors if the request was cancelled
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return;
      }

      console.error('Error saving page:', error);
      setSaveStatus('error');

      if (error.response?.status === 401) {
        handleUnauthorized(error);
        return;
      }

      toast.error('Failed to save page - changes cached locally');
    } finally {
      // Clear the abort controller reference if this was the current request
      if (saveAbortControllerRef.current?.signal.aborted === false) {
        saveAbortControllerRef.current = null;
      }
    }
  };

  const handleDeletePage = async () => {
    if (!activePage?.id) return;

    if (!confirm(`Are you sure you want to delete "${activePage.name}"?`)) return;

    try {
      // Direct server call for delete
      const response = await pagesAPI.deletePage(activePage.id);

      if (response.status === 200 || response.status === 204) {
        toast.success('Page deleted successfully!');
        setActivePage(null);
        setPageContent('');

        // Clear any unsaved changes for this page
        localStorage.removeItem(`unsaved_page_${activePage.id}`);
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized(error);
        return;
      }
      toast.error('Failed to delete page');
      console.error('Error deleting page:', error);
    }
  };

  const handleRenamePage = async () => {
    const newName = prompt(`Rename "${activePage.name}" to:`, activePage.name);
    if (newName && newName.trim() && newName !== activePage.name) {
      try {
        // Direct server call for rename
        const response = await pagesAPI.renamePage(activePage.id, newName.trim());

        if (response.status === 200 || response.status === 201) {
          toast.success('Page renamed successfully!');
          // Update the active page name in state
          setActivePage((prev) => (prev ? { ...prev, name: newName.trim() } : null));
        } else {
          throw new Error('Rename failed');
        }
      } catch (error) {
        console.error('Error renaming page:', error);
        toast.error('Failed to rename page');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-base-100 via-base-100 to-base-200/20 pt-16 relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <Sidebar
        onPageSelect={(page) => {
          setActivePage(page);
          setIsSidebarOpen(false);
        }}
        selectedPageId={activePage?.id}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col">
        {/* Enhanced Top Bar */}
        <TopBar
          activePage={activePage}
          onSave={() => handleSave()}
          onDelete={handleDeletePage}
          onRename={handleRenamePage}
          lastSaved={lastSaved}
          saveStatus={saveStatus}
        />

        {/* Enhanced Note Editor */}
        <Note
          activePage={activePage}
          content={pageContent}
          onContentChange={handleContentChange}
          onSave={handleSave}
        />
      </div>

      {/* Floating Reminders Button - Only show when sidebar is closed */}
      {!isRemindersSidebarOpen && (
        <button
          onClick={() => setIsRemindersSidebarOpen(true)}
          className="fixed bottom-6 right-6 btn btn-primary btn-lg gap-3 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:scale-105 transition-all duration-300 z-50 group"
          title="Open Reminders"
        >
          <FiBell className="w-6 h-6 group-hover:animate-pulse" />
          <span className="font-semibold">Reminders</span>
        </button>
      )}

      {/* Reminders Sidebar Component */}
      <Reminder isOpen={isRemindersSidebarOpen} onClose={() => setIsRemindersSidebarOpen(false)} />
    </div>
  );
};

export default Dashboard;
