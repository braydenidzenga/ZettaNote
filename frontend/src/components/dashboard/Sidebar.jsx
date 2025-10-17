import { useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  FiPlus,
  FiFile,
  FiShare2,
  FiSearch,
  FiMoreHorizontal,
  FiEdit3,
  FiTrash2,
  FiUsers,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import authContext from '../../context/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { VITE_API_URL } from '../../env';
import { createPortal } from 'react-dom';

const Sidebar = ({ onPageSelect, selectedPageId, isOpen, onClose }) => {
  const { user, setuser } = useContext(authContext);
  const navigate = useNavigate();

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

  const [pages, setPages] = useState([]);
  const [sharedPages, setSharedPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyPages, setShowMyPages] = useState(true);
  const [showSharedPages, setShowSharedPages] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [renamePageName, setRenamePageName] = useState('');
  const [renamePageId, setRenamePageId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${VITE_API_URL}/api/pages/getpages`,
        {},
        { withCredentials: true }
      );

      if (response.data.OwnedPages) {
        const transformedPages = response.data.OwnedPages.map((page) => ({
          _id: page.id,
          title: page.name,
          pageName: page.name,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }));
        setPages(transformedPages);
      }

      if (response.data.SharedPages) {
        const transformedSharedPages = response.data.SharedPages.map((page) => ({
          _id: page.id,
          title: page.name,
          pageName: page.name,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          owner: { name: 'Shared User' },
        }));
        setSharedPages(transformedSharedPages);
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;
      console.error('Error fetching pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

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

  const deletePage = async (pageId, pageName) => {
    if (!confirm(`Are you sure you want to delete "${pageName}"? This action cannot be undone.`))
      return;

    try {
      setIsDeleting(true);

      const response = await axios.delete(`${VITE_API_URL}/api/pages/deletepage`, {
        data: { pageId },
        withCredentials: true,
      });

      if (response.data.success || response.data.message?.includes('deleted')) {
        toast.success('Page deleted successfully!');
        fetchPages();
        if (selectedPageId === pageId && onPageSelect) {
          onPageSelect(null);
        }
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;
      const errorMsg = error.response?.data?.message || 'Failed to delete page';
      toast.error(errorMsg);
      console.error('Error deleting page:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openRenameModal = (pageId, currentName) => {
    setRenamePageId(pageId);
    setRenamePageName(currentName);
    setShowRenameModal(true);
  };

  const closeRenameModal = () => {
    setShowRenameModal(false);
    setRenamePageName('');
    setRenamePageId('');
    setIsRenaming(false);
  };

  const renamePage = async () => {
    if (!renamePageName.trim()) {
      toast.error('Page name cannot be empty');
      return;
    }

    if (renamePageName.trim() === pages.find((p) => p._id === renamePageId)?.title) {
      closeRenameModal();
      return;
    }

    try {
      setIsRenaming(true);

      const response = await axios.post(
        `${VITE_API_URL}/api/pages/renamepage`,
        {
          pageId: renamePageId,
          newPageName: renamePageName.trim(),
        },
        { withCredentials: true }
      );

      if (
        response.data['Updated Page'] ||
        response.data.message?.includes('renamed') ||
        response.data.message?.includes('updated')
      ) {
        toast.success(`Page renamed to "${renamePageName}" successfully!`);
        fetchPages();
        closeRenameModal();

        if (selectedPageId === renamePageId && onPageSelect) {
          const updatedPage = pages.find((p) => p._id === renamePageId);
          if (updatedPage) {
            onPageSelect({
              ...updatedPage,
              id: renamePageId,
              name: renamePageName.trim(),
              title: renamePageName.trim(),
            });
          }
        }
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;
      const errorMsg = error.response?.data?.message || 'Failed to rename page';
      toast.error(errorMsg);
      console.error('Error renaming page:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [fetchPages, user]);

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSharedPages = sharedPages.filter((page) =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Sidebar Container */}
      <div
        className={`w-72 h-screen bg-base-100 border-r border-t border-base-300 fixed left-0 top-16.5 lg:top-18 z-50 flex flex-col shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Enhanced Header */}
        <div className="p-6 border-b border-base-300/60 bg-base-100/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/10">
                <FiFolder className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-bold text-xl text-base-content">Pages</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openCreateModal}
                className="btn btn-primary btn-sm gap-2 hover:scale-110 transition-all duration-200 rounded-xl shadow-lg shadow-primary/25"
                title="Create New Page"
              >
                <FiPlus className="w-4 h-4" />
                <span className="hidden xl:inline">New</span>
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
          </div>

          {/* Enhanced Search */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your pages..."
              className="input input-bordered w-full pl-12 pr-4 py-3 bg-base-200/50 border-base-300/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-sm placeholder:text-base-content/40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 btn btn-ghost btn-xs btn-circle hover:bg-base-300"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center animate-pulse">
                <FiFolder className="w-6 h-6 text-primary/60" />
              </div>
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 font-medium">Loading your pages...</p>
            </div>
          ) : (
            <>
              {/* Enhanced My Pages Section */}
              <div className="space-y-4">
                <button
                  onClick={() => setShowMyPages(!showMyPages)}
                  className="flex items-center gap-3 font-bold text-base-content/90 hover:text-base-content transition-all duration-200 w-full text-left p-3 rounded-2xl hover:bg-base-200/50 group"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {showMyPages ? (
                      <FiChevronDown className="w-4 h-4 text-primary" />
                    ) : (
                      <FiChevronRight className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <FiFolder className="w-5 h-5 text-primary" />
                  <span className="text-base">My Pages</span>
                  <div className="ml-auto bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-bold">
                    {filteredPages.length}
                  </div>
                </button>

                {showMyPages && (
                  <div className="space-y-2 ml-4">
                    {filteredPages.length > 0 ? (
                      filteredPages.map((page) => (
                        <div key={page._id} className="group relative">
                          <div
                            className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                              selectedPageId === page._id
                                ? 'bg-primary/10 border border-primary/30 shadow-lg'
                                : 'hover:bg-base-200/60 hover:shadow-md hover:scale-[1.01]'
                            }`}
                            onClick={() =>
                              onPageSelect &&
                              onPageSelect({ id: page._id, name: page.title, ...page })
                            }
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  selectedPageId === page._id
                                    ? 'bg-primary/20 border border-primary/20'
                                    : 'bg-base-200/60 group-hover:bg-primary/10'
                                }`}
                              >
                                <FiFile
                                  className={`w-5 h-5 ${
                                    selectedPageId === page._id
                                      ? 'text-primary'
                                      : 'text-base-content/60 group-hover:text-primary'
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-semibold truncate ${
                                    selectedPageId === page._id
                                      ? 'text-primary'
                                      : 'text-base-content group-hover:text-primary'
                                  }`}
                                >
                                  {page.title || 'Untitled'}
                                </p>
                                <p className="text-xs text-base-content/60 mt-1">
                                  {new Date(page.updatedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Page Actions Dropdown */}
                            <div className="flex-shrink-0">
                              <div className="dropdown dropdown-end">
                                <div
                                  tabIndex={0}
                                  role="button"
                                  className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FiMoreHorizontal className="w-4 h-4" />
                                </div>
                                <ul
                                  tabIndex={0}
                                  className="dropdown-content menu bg-base-100 rounded-box z-[1] w-44 p-2 shadow-xl border border-base-300"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <li>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRenameModal(page._id, page.title);
                                      }}
                                      className="flex items-center gap-3 text-sm"
                                    >
                                      <FiEdit3 className="w-4 h-4 text-blue-500" />
                                      Rename
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deletePage(page._id, page.title);
                                      }}
                                      className="flex items-center gap-3 text-sm text-error hover:bg-error/10"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-base-content/60">
                        <FiFile className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No pages found</p>
                        <button
                          onClick={openCreateModal}
                          className="text-primary hover:text-primary-focus text-sm mt-1"
                        >
                          Create your first page
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shared Pages Section */}
              <div>
                <button
                  onClick={() => setShowSharedPages(!showSharedPages)}
                  className="flex items-center gap-2 font-semibold text-base-content/80 mb-3 hover:text-base-content transition-colors w-full text-left"
                >
                  {showSharedPages ? (
                    <FiChevronDown className="w-4 h-4" />
                  ) : (
                    <FiChevronRight className="w-4 h-4" />
                  )}
                  <FiUsers className="w-4 h-4 text-secondary" />
                  Shared with me ({filteredSharedPages.length})
                </button>

                {showSharedPages && (
                  <div className="space-y-1 ml-6">
                    {filteredSharedPages.length > 0 ? (
                      filteredSharedPages.map((page) => (
                        <div key={page._id} className="group">
                          <div
                            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors cursor-pointer ${
                              selectedPageId === page._id
                                ? 'bg-secondary/10 border border-secondary/20'
                                : ''
                            }`}
                            onClick={() =>
                              onPageSelect &&
                              onPageSelect({ id: page._id, name: page.title, ...page })
                            }
                          >
                            <FiShare2
                              className={`w-4 h-4 flex-shrink-0 ${
                                selectedPageId === page._id ? 'text-secondary' : 'text-secondary'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  selectedPageId === page._id
                                    ? 'text-secondary'
                                    : 'text-base-content'
                                }`}
                              >
                                {page.title || 'Untitled'}
                              </p>
                              <p className="text-xs text-base-content/60">
                                by {page.owner?.name || 'Unknown'}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded-full">
                              Shared
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-base-content/60">
                        <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No shared pages</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300 bg-base-100 sticky bottom-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-base-content truncate">
                {user?.name || user?.email || 'User'}
              </p>
              <p className="text-xs text-base-content/60">{pages.length} pages</p>
            </div>
          </div>
        </div>

        {/* Rename Page Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300">
              {/* Modal Header */}
              <div className="p-6 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FiEdit3 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-base-content">Rename Page</h3>
                    <p className="text-sm text-base-content/60">Give your page a new name</p>
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
                      placeholder="Enter new page name..."
                      className="input input-bordered w-full focus:input-primary focus:outline-none"
                      value={renamePageName}
                      onChange={(e) => setRenamePageName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isRenaming) {
                          renamePage();
                        }
                      }}
                      autoFocus
                      maxLength={100}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-base-content/60">
                        {renamePageName.length}/100 characters
                      </span>
                      {renamePageName.trim() &&
                        renamePageName.trim() !==
                          pages.find((p) => p._id === renamePageId)?.title && (
                          <span className="text-xs text-success">✓ Ready to rename</span>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 pt-0 flex justify-end gap-3">
                <button onClick={closeRenameModal} className="btn btn-ghost" disabled={isRenaming}>
                  Cancel
                </button>
                <button
                  onClick={renamePage}
                  className="btn btn-primary gap-2"
                  disabled={
                    !renamePageName.trim() ||
                    isRenaming ||
                    renamePageName.trim() === pages.find((p) => p._id === renamePageId)?.title
                  }
                >
                  {isRenaming ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Renaming...
                    </>
                  ) : (
                    <>
                      <FiEdit3 className="w-4 h-4" />
                      Rename
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Loading overlay for delete operation */}
        {isDeleting && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-2xl p-6 shadow-xl border border-base-300">
              <div className="flex items-center gap-3">
                <span className="loading loading-spinner loading-md text-error"></span>
                <span className="text-base-content font-medium">Deleting page...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Tab Button for Mobile - Only visible on mobile when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => onClose && onClose()}
          className="lg:hidden fixed h-55 left-0 top-1/3 z-40 bg-primary text-primary-content  py-4 rounded-r-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:px-4 group flex items-center gap-2"
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

Sidebar.propTypes = {
  onPageSelect: PropTypes.func,
  selectedPageId: PropTypes.string,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

export default Sidebar;
