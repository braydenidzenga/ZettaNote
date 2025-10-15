import { useState, useEffect, useContext, useCallback } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';
import Note from '../components/dashboard/Note';
import authContext from '../context/AuthProvider';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { VITE_API_URL } from '../env';

const Dashboard = () => {
  const { user, setuser } = useContext(authContext);
  const [activePage, setActivePage] = useState(null);
  const [pageContent, setPageContent] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
          const response = await axios.get(`${VITE_API_URL}/api/auth/getuser`, {
            withCredentials: true,
          });

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
        setIsLoading(true);
        const response = await axios.post(
          `${VITE_API_URL}/api/pages/getpage`,
          { pageId },
          { withCredentials: true }
        );

        if (response.data.Page) {
          setPageContent(response.data.Page.pageData || '');
          setLastSaved(response.data.Page.updatedAt);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          handleUnauthorized(error);
          return;
        }
        toast.error('Failed to load page content');
        console.error('Error loading page:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    if (activePage?.id) {
      loadPageContent(activePage.id);
    } else {
      setPageContent('');
    }
  }, [activePage, loadPageContent]);

  const handleContentChange = (newContent) => {
    setPageContent(newContent);
    clearTimeout(window.autoSaveTimeout);
    window.autoSaveTimeout = setTimeout(() => {
      handleSave(newContent);
    }, 2000);
  };

  const handleSave = async (content = pageContent) => {
    if (!activePage?.id) return;

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${VITE_API_URL}/api/pages/savepage`,
        {
          pageId: activePage.id,
          newPageData: content,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setLastSaved(new Date().toISOString());
        toast.success('Page saved successfully!');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      toast.error('Failed to save page');
      console.error('Error saving page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePage = async () => {
    if (!activePage?.id) return;

    if (!confirm(`Are you sure you want to delete "${activePage.name}"?`)) return;

    try {
      const response = await axios.delete(`${VITE_API_URL}/api/pages/deletepage`, {
        data: { pageId: activePage.id },
        withCredentials: true,
      });

      if (response.data.success || response.data.message?.includes('deleted')) {
        toast.success('Page deleted successfully!');
        setActivePage(null);
        setPageContent('');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      toast.error('Failed to delete page');
      console.error('Error deleting page:', error);
    }
  };

  const handleRenamePage = () => {
    const newName = prompt(`Rename "${activePage.name}" to:`, activePage.name);
    if (newName && newName.trim() && newName !== activePage.name) {
      toast.info('Rename functionality would be implemented with backend API');
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
          isLoading={isLoading}
        />

        {/* Enhanced Note Editor */}
        <Note
          activePage={activePage}
          content={pageContent}
          onContentChange={handleContentChange}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default Dashboard;
