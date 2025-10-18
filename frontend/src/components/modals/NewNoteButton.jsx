import { useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  FiPlus,
  FiChevronRight,
  FiEdit,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import authContext from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { VITE_API_URL } from '../../env';
import { createPortal } from 'react-dom';

const NewNoteButton = ({ onPageSelect, isOpen, onClose }) => {
  const { user, setuser } = useContext(authContext);
  const navigate = useNavigate();

  const handleUnauthorized = useCallback(
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setuser(null);
        navigate('/');
        return true;
      }
      return false;
    },
    [setuser, navigate]
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${VITE_API_URL}/api/pages/getpages`, {
        withCredentials: true,
      });
      
      if (response.data.pages) {
        setPages(response.data.pages);
      }
      if (response.data.sharedPages) {
        setSharedPages(response.data.sharedPages);
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;
      console.error('Error fetching pages:', error);
      toast.error('Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [fetchPages, user]);

  const openCreateModal = () => {
    setNewPageName('');
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewPageName('');
    setIsCreating(false);
  };

  const createNewPage = async () => {
    if (!newPageName.trim()) {
      toast.error('Page name cannot be empty');
      return;
    }

    try {
      setIsCreating(true);
      const response = await axios.post(
        `${VITE_API_URL}/api/pages/createpage`,
        {
          pageName: newPageName.trim(),
        },
        { withCredentials: true }
      );

      if (response.data.Page) {
        toast.success(`Page "${newPageName}" created successfully!`);
        fetchPages();
        closeCreateModal();

        if (onPageSelect && response.data.Page) {
          onPageSelect({
            id: response.data.Page.id || response.data.Page._id,
            name: newPageName,
            ...response.data.Page,
          });
        }
      } else if (response.data.message) {
        toast.success(response.data.message);
        fetchPages();
        closeCreateModal();
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;
      const errorMsg = error.response?.data?.message || 'Failed to create page';
      toast.error(errorMsg);
      console.error('Error creating page:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
            onClick={openCreateModal}
            className="w-20 h-20 mx-auto bg-primary/20 rounded-3xl flex items-center justify-center shadow-lg border border-primary/10 cursor-pointer hover:bg-primary/30 hover:scale-105 transition-all duration-200"
            title="Create New Page"
        >
          <FiEdit className="w-10 h-10 text-primary" />
        </button>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-circle lg:hidden hover:btn-error hover:scale-110 transition-all duration-200"
          title="Close sidebar"
        >
          ×
        </button>
      </div>

      {/* Create Page Modal */}
      {showCreateModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeCreateModal}
          >
            <div
              className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300"
              onClick={(event) => event.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FiPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-base-content">Create New Page</h3>
                    <p className="text-sm text-base-content/60">
                      Give your page a memorable name
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">
                      Page Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter page name..."
                      className="input input-bordered w-full focus:input-primary focus:outline-none"
                      value={newPageName}
                      onChange={(e) => setNewPageName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isCreating) {
                          createNewPage();
                        }
                      }}
                      autoFocus
                      maxLength={100}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-base-content/60">
                        {newPageName.length}/100 characters
                      </span>
                      {newPageName.trim() && (
                        <span className="text-xs text-success">✓ Ready to create</span>
                      )}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <p className="text-xs text-base-content/60 mb-2">Quick suggestions:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Meeting Notes',
                        'Ideas',
                        'To-Do List',
                        'Project Plan',
                        'Daily Journal',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setNewPageName(suggestion)}
                          className="btn btn-xs btn-ghost btn-outline hover:btn-primary"
                          disabled={isCreating}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 pt-0 flex justify-end gap-3">
                <button
                  onClick={closeCreateModal}
                  className="btn btn-ghost"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={createNewPage}
                  className="btn btn-primary gap-2"
                  disabled={!newPageName.trim() || isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-4 h-4" />
                      Create Page
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Floating Tab Button for Mobile - Only visible on mobile when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => onClose && onClose()}
          className="lg:hidden fixed h-55 left-0 top-1/3 z-40 bg-primary text-primary-content py-4 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:px-4 group flex items-center gap-2"
          aria-label="Open sidebar"
        >
          <FiChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Swipe-to-close indicator when sidebar is open on mobile */}
      {isOpen && (
        <button
          onClick={onClose}
          className="lg:hidden fixed left-72 top-24 z-40 bg-base-100 text-base-content px-2 py-4 rounded-r-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-l-0 border-base-300"
          aria-label="Close sidebar"
        >
          <FiChevronRight className="w-4 h-4 rotate-180" />
        </button>
      )}
    </>
  );
};

NewNoteButton.propTypes = {
  onPageSelect: PropTypes.func,
  selectedPageId: PropTypes.string,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

export default NewNoteButton;
