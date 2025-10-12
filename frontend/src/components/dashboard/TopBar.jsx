import { useContext, useState } from 'react';
import {
  FiShare2,
  FiCopy,
  FiExternalLink,
  FiSave,
  FiClock,
  FiFile,
  FiRefreshCw,
  FiGlobe,
  FiDownload,
  FiCheckCircle,
  FiMenu,
  FiX,
  FiUsers,
  FiMail,
  FiPlus,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import authContext from '../../context/AuthProvider';
import { VITE_API_URL } from '../../env';
import propTypes from 'prop-types';

const TopBar = ({ activePage, onSave, lastSaved, isLoading, onToggleSidebar, isSidebarOpen }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [lastFailedEmail, setLastFailedEmail] = useState('');
  const [isFetchingSharedUsers, setIsFetchingSharedUsers] = useState(false);
  const navigate = useNavigate();
  const { user, setuser } = useContext(authContext);
  
  const handleUnauthorized = (error) => {
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
  };
  const [shareSettings, setShareSettings] = useState({
    isPublic: true,
    allowComments: false,
    allowDownload: true,
    expiresAt: null,
  });

  const generateShareableLink = async () => {
    if (!activePage?.id) return;

    setIsGeneratingLink(true);
    try {
      const response = await axios.post(
        `${VITE_API_URL}/api/pages/publicshare`,
        {
          pageId: activePage.id,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 200 && response.data) {
        const publicLink = `${window.location.origin}/public/${response.data.publicShareId}`;
        setShareableLink(publicLink);

        if (response.data.message === 'Already Shared') {
          toast.success('🔗 Public link retrieved successfully!');
        } else {
          toast.success('🔗 Public link generated successfully!');
        }
      } else {
        throw new Error(
          response.data?.Error || response.data?.message || 'Failed to generate link'
        );
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;
      console.error('Error generating share link:', error);
      if (error.response) {
        toast.error(
          `❌ Failed to generate link: ${
            error.response.data?.Error || error.response.data?.message || 'Server error'
          }`
        );
      } else if (error.request) {
        toast.error('❌ Network error. Please check your connection.');
      } else {
        toast.error(`❌ Failed to generate link: ${error.message}`);
      }
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const regenerateLink = async () => {
    if (!activePage?.id) return;

    toast.loading('Regenerating link...', { id: 'regenerate' });

    try {
      await generateShareableLink();
      toast.success('New link generated!', { id: 'regenerate' });
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error('Failed to regenerate link', { id: 'regenerate' });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const fetchSharedUsers = async () => {
    if (!activePage?.id) return;

    setIsFetchingSharedUsers(true);

    try {
      const pageResponse = await axios.post(
        `${VITE_API_URL}/api/pages/getpage`,
        {
          pageId: activePage.id,
        },
        {
          withCredentials: true,
          timeout: 5000,
        }
      );

      if (pageResponse.status === 200 && pageResponse.data.Page) {
        const page = pageResponse.data.Page;
        const sharedToIds = page.sharedTo || [];

        if (sharedToIds.length === 0) {
          setSharedUsers([]); // No Users
          return;
        }

        const userPromises = sharedToIds.map(async (userId) => {
          try {
            const userResponse = await axios.post(
              `${VITE_API_URL}/api/auth/getuserbyid`,
              { userId },
              { withCredentials: true, timeout: 5000 }
            );

            if (userResponse.status === 200 && userResponse.data.user) {
              const userData = userResponse.data.user;
              return {
                id: userData.id,
                name: userData.name,
                email: userData.email,
              };
            }
            throw new Error('Invalid user response');
          } catch (error) {
            console.warn(`Failed to fetch user ${userId}:`, error.message);
          }
        });

        const sharedUsers = await Promise.all(userPromises);
        setSharedUsers(sharedUsers);
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;
    } finally {
      setIsFetchingSharedUsers(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
    generateShareableLink();
    fetchSharedUsers();
  };

  const inviteUser = async () => {
    if (!newUserEmail.trim() || !activePage?.id) {
      toast.error('Please select a page and enter an email address');
      return;
    }

    if (newUserEmail.trim().toLowerCase() === user?.email) {
      toast.error('You cannot invite yourself');
      return;
    }

    // email validation
    if (!newUserEmail.trim().includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    const loadingToast = toast.loading('Sharing page...');

    try {
      const response = await axios.post(
        `${VITE_API_URL}/api/pages/sharepage`,
        {
          pageId: activePage.id,
          email: newUserEmail.trim(),
        },
        {
          withCredentials: true,
          timeout: 10000,
        }
      );

      toast.dismiss(loadingToast);

      if (response.status === 200 || response.status === 201) {
        toast.success(`Page shared with ${newUserEmail}!`);
        setNewUserEmail('');
        setSharedUsers((prev) => [
          ...prev,
          {
            email: newUserEmail.trim(),
            id: `temp_${Date.now()}`,
          },
        ]);
      } else {
        throw new Error(response.data?.message || response.data?.Error || 'Failed to share page');
      }
    } catch (error) {
      toast.dismiss(loadingToast);

      if (handleUnauthorized(error)) return;

      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else if (error.response) {
        if (error.response.data?.message) {
          toast.error(`Failed to share: ${error.response.data.message}`);
        } else {
          toast.error(`Failed to share.`);
        }
      } else if (error.request) {
        setLastFailedEmail(newUserEmail.trim());
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error(`Unexpected error occurred: ${error.message}`);
      }
    } finally {
      setIsInviting(false);
    }
  };

  const removeSharedUser = async (userEmail) => {
    try {
      const response=await axios.post(`${VITE_API_URL}/api/pages/sharepage/remove-user`, {
        gmail: userEmail,
        id: activePage.id
      }, {
        withCredentials: true,
      });
      if (response.status !== 200) {
        throw new Error(response.data?.message || 'Failed to remove user access');
      }
      setSharedUsers((prev) =>
        Array.isArray(prev) ? prev.filter((user) => user.email !== userEmail) : []
      );

      toast.success(`Removed ${userEmail} from shared users`);
    } catch (error) {
      console.error('Error removing shared user:', error);
      toast.error('Failed to remove user access');
    }
  };

  const formatLastSaved = (timestamp) => {
    if (!timestamp) return 'Never saved';
    const now = new Date();
    const saved = new Date(timestamp);
    const diffInSeconds = Math.floor((now - saved) / 1000);

    if (diffInSeconds < 60) return 'Saved just now';
    if (diffInSeconds < 3600) return `Saved ${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `Saved ${Math.floor(diffInSeconds / 3600)}h ago`;
    return `Saved ${saved.toLocaleDateString()}`;
  };

  
  return (
    <>
      <div className="h-16 lg:h-20 bg-base-100 border-b border-base-300 flex items-center justify-between px-4 lg:px-8 sticky top-16 z-30 shadow-sm">
        {/* Left Section - Enhanced Page Info */}
        <div className="flex items-center space-x-6">
          {/* Mobile Menu Button */}
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost btn-sm btn-circle lg:hidden hover:btn-primary hover:scale-110 transition-all duration-200"
            title={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10">
              <FiFile className="w-6 h-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content truncate max-w-32 sm:max-w-48 lg:max-w-md">
                {activePage?.name || 'Select a page'}
              </h1>
              <div className="flex items-center space-x-2 lg:space-x-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-1 lg:space-x-2 text-base-content/60">
                  <FiClock className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="font-medium hidden sm:inline">{formatLastSaved(lastSaved)}</span>
                </div>
                {isLoading && (
                  <div className="flex items-center space-x-2 text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Saving...</span>
                  </div>
                )}
                {!isLoading && activePage && (
                  <div className="flex items-center space-x-2 text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-medium">Synced</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Enhanced Actions */}
        {activePage && (
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Action Buttons Group */}
            <div className="flex items-center gap-5 bg-base-200/50 rounded-2xl p-1 lg:p-1.5 border border-base-300/30 shadow-sm">
              {/* Save Button */}
              <button
                onClick={onSave}
                className="btn btn-ghost btn-sm gap-1 lg:gap-2 hover:btn-success hover:scale-105 transition-all duration-200 rounded-xl"
                disabled={isLoading}
                title="Save page (Ctrl+S)"
              >
                <FiSave className="w-4 h-4" />
                <span className="hidden sm:inline lg:inline">Save</span>
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="btn btn-primary btn-sm gap-1 lg:gap-2 hover:scale-105 transition-all duration-200 rounded-xl shadow-lg shadow-primary/25"
                title="Share page publicly"
              >
                <FiShare2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-base-300/60 backdrop-blur-xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 pb-6 bg-base-100 border-b border-base-300/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <FiGlobe className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-base-content">
                      Share &quot;{activePage?.name}&quot;
                    </h3>
                    <p className="text-sm text-base-content/70 mt-1">
                      Share publicly or with specific people
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="btn btn-ghost btn-sm btn-circle hover:btn-error hover:scale-110 transition-all text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Enhanced Modal Content */}
            <div className="p-8 space-y-8">
              {/* Public Share Section */}
              <div className="bg-base-200/30 rounded-2xl p-6 border border-base-300/50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 text-lg font-semibold text-base-content">
                      <FiGlobe className="w-5 h-5 text-primary" />
                      Public Share
                    </label>
                    <button
                      onClick={regenerateLink}
                      className="btn btn-ghost btn-sm gap-2 hover:btn-primary rounded-xl"
                      disabled={isGeneratingLink}
                      title="Generate new link"
                    >
                      <FiRefreshCw
                        className={`w-4 h-4 ${isGeneratingLink ? 'animate-spin' : ''}`}
                      />
                      <span className="hidden sm:inline">New Link</span>
                    </button>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Create a public link to share with anyone
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      className="input input-bordered w-full pr-20 text-sm bg-base-100 border-2 focus:border-primary rounded-xl h-12"
                      value={shareableLink}
                      readOnly
                      placeholder={
                        isGeneratingLink
                          ? '🔗 Generating secure public link...'
                          : 'Your public link will appear here'
                      }
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                      <button
                        onClick={() => copyToClipboard(shareableLink)}
                        className="btn btn-primary btn-sm btn-circle hover:scale-110 transition-all"
                        disabled={!shareableLink || isGeneratingLink}
                        title="Copy to clipboard"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(shareableLink, '_blank')}
                        className="btn btn-secondary btn-sm btn-circle hover:scale-110 transition-all"
                        disabled={!shareableLink || isGeneratingLink}
                        title="Open in new tab"
                      >
                        <FiExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {shareableLink && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Public link is active and ready to share</span>
                    </div>
                  )}

                  {/* Public Share Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={shareSettings.isPublic}
                          onChange={(e) =>
                            setShareSettings({ ...shareSettings, isPublic: e.target.checked })
                          }
                        />
                        <div className="flex items-center gap-2">
                          <FiGlobe className="w-4 h-4" />
                          <span className="label-text font-medium">Public Access</span>
                        </div>
                      </label>
                      <p className="text-xs text-base-content/60 ml-8">
                        Anyone with the link can view
                      </p>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-secondary"
                          checked={shareSettings.allowDownload}
                          onChange={(e) =>
                            setShareSettings({ ...shareSettings, allowDownload: e.target.checked })
                          }
                        />
                        <div className="flex items-center gap-2">
                          <FiDownload className="w-4 h-4" />
                          <span className="label-text font-medium">Allow Download</span>
                        </div>
                      </label>
                      <p className="text-xs text-base-content/60 ml-8">
                        Viewers can download as PDF/MD
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Private Share Section */}
              <div className="bg-secondary/5 rounded-2xl p-6 border border-secondary/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FiUsers className="w-5 h-5 text-secondary" />
                      <h4 className="text-lg font-semibold text-base-content">Private Share</h4>
                    </div>
                    <button
                      onClick={fetchSharedUsers}
                      className="btn btn-ghost btn-sm gap-1 hover:btn-secondary rounded-lg"
                      disabled={isFetchingSharedUsers}
                      title="Refresh shared users list"
                    >
                      <FiRefreshCw
                        className={`w-4 h-4 ${isFetchingSharedUsers ? 'animate-spin' : ''}`}
                      />
                      <span className="hidden sm:inline text-xs">
                        {isFetchingSharedUsers ? 'Loading...' : 'Refresh'}
                      </span>
                    </button>
                  </div>
                  <p className="text-sm text-base-content/70">
                    Share with specific people who can view and edit
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
                        <input
                          type="email"
                          className="input input-bordered w-full pl-10 text-sm bg-base-100 border-2 focus:border-secondary rounded-xl h-12"
                          placeholder="Enter email address..."
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              inviteUser();
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={inviteUser}
                        className="btn btn-secondary gap-2 rounded-xl hover:scale-105 transition-all"
                        disabled={!newUserEmail.trim() || isInviting}
                      >
                        {isInviting ? (
                          <div className="loading loading-spinner loading-sm"></div>
                        ) : (
                          <FiPlus className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">
                          {isInviting ? 'Inviting...' : 'Invite'}
                        </span>
                      </button>
                    </div>

                    {lastFailedEmail && lastFailedEmail !== newUserEmail && (
                      <div className="text-xs text-warning bg-warning/10 rounded-lg p-2 flex items-center justify-between">
                        <span>Previous attempt failed for: {lastFailedEmail}</span>
                        <button
                          onClick={() => {
                            setNewUserEmail(lastFailedEmail);
                            setLastFailedEmail('');
                          }}
                          className="btn btn-ghost btn-xs text-warning hover:text-warning-content"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>

                  {/* User List */}
                  {!isFetchingSharedUsers &&
                    Array.isArray(sharedUsers) &&
                    sharedUsers.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-base-content/80">
                          Shared with ({sharedUsers.length}):
                        </h5>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {sharedUsers.map((sharedUser) => (
                            <div
                              key={sharedUser.id || sharedUser.email}
                              className="flex items-center justify-between bg-base-100 rounded-xl p-3 border border-base-300/50 hover:bg-base-200/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-semibold text-secondary">
                                    {sharedUser.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-base-content">
                                      {sharedUser.name}
                                    </span>
                                  </div>
                                  <span className="text-xs text-base-content/60">
                                    {sharedUser.email}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeSharedUser(sharedUser.email)}
                                className="btn btn-ghost btn-sm btn-circle hover:btn-error hover:scale-110 transition-all text-base-content/60 hover:text-error"
                                title="Remove access"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {isFetchingSharedUsers && (
                    <div className="text-center py-4 text-base-content/50 text-sm">
                      <div className="loading loading-spinner loading-md mx-auto mb-2"></div>
                      <p>Loading shared users...</p>
                    </div>
                  )}

                  {!isFetchingSharedUsers &&
                    (!Array.isArray(sharedUsers) || sharedUsers.length === 0) && (
                      <div className="text-center py-4 text-base-content/50 text-sm">
                        <FiUsers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No users have been invited yet</p>
                        <p className="text-xs mt-1 opacity-70">
                          Enter an email above to start sharing
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Enhanced Modal Footer */}
            <div className="p-8 pt-0 flex justify-between items-center border-t border-base-300/60">
              <div className="text-sm text-base-content/60 flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span>
                  {shareableLink && Array.isArray(sharedUsers) && sharedUsers.length > 0
                    ? 'Public & private sharing active'
                    : shareableLink
                    ? 'Public sharing active'
                    : Array.isArray(sharedUsers) && sharedUsers.length > 0
                    ? 'Private sharing active'
                    : 'No active sharing'}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="btn btn-ghost rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (shareableLink) {
                      copyToClipboard(shareableLink);
                    }
                    setShowShareModal(false);
                  }}
                  className="btn btn-primary gap-2 rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-all"
                  disabled={!shareableLink}
                >
                  <FiCopy className="w-4 h-4" />
                  {shareableLink ? 'Copy Link & Close' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

TopBar.propTypes = {
  activePage: propTypes.object,
  onSave: propTypes.func.isRequired,
  onDelete: propTypes.func,
  onRename: propTypes.func,
  lastSaved: propTypes.string,
  isLoading: propTypes.bool,
  onToggleSidebar: propTypes.func.isRequired,
  isSidebarOpen: propTypes.bool.isRequired,
};

export default TopBar;
