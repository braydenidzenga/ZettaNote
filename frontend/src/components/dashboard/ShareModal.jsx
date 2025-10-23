import React, { useState, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  FiGlobe,
  FiUsers,
  FiMail,
  FiPlus,
  FiX,
  FiCheckCircle,
  FiRefreshCw,
  FiCopy,
  FiExternalLink,
  FiDownload,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { pagesAPI, authAPI, apiUtils } from '../../utils/api';
import authContext from '../../context/AuthProvider';

const ShareModal = ({ isOpen, onClose, activePage }) => {
  const [shareableLink, setShareableLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [lastFailedEmail, setLastFailedEmail] = useState('');
  const [isFetchingSharedUsers, setIsFetchingSharedUsers] = useState(false);
  const [currentShareSetting, setCurrentShareSetting] = useState({
    isPublic: null,
    allowComments: false,
    allowDownload: null,
    expiresAt: null,
  });
  const [previousShareSettings, setPreviousShareSettings] = useState({
    isPublic: null,
    allowComments: false,
    allowDownload: null,
    expiresAt: null,
  });

  const { user } = useContext(authContext);

  const handleUnauthorized = (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized - could emit event or redirect
      return true;
    }
    return false;
  };

  const getStatus = useCallback(async () => {
    try {
      const response = await pagesAPI.getPage(activePage.id);
      const data = response.data.Page;

      setPreviousShareSettings({
        ...currentShareSetting,
        isPublic: !!data.publicShareId,
        allowDownload: data.allowDownload,
      });
      setCurrentShareSetting({
        ...currentShareSetting,
        isPublic: !!data.publicShareId,
        allowDownload: data.allowDownload,
      });

      if (data.publicShareId) {
        setShareableLink(`${window.location.origin}/public/${data.publicShareId}`);
      } else {
        setShareableLink('');
      }
    } catch (error) {
      if (handleUnauthorized(error)) return;
      console.error('Error getting page status:', error);
    }
  }, [activePage?.id, currentShareSetting]);

  const handleSave = async () => {
    if (
      currentShareSetting.isPublic != previousShareSettings.isPublic &&
      currentShareSetting.isPublic
    ) {
      generateShareableLink();
      return;
    }

    try {
      await pagesAPI.publicShare({
        pageId: activePage.id,
        allowDownload: currentShareSetting.allowDownload,
        isPublic: currentShareSetting.isPublic,
        isRegenerate: currentShareSetting.isPublic ? false : true,
      });
      toast.success('Saved Successfully');
    } catch (error) {
      if (handleUnauthorized(error)) return;
      toast.error('Error Saving');
    }
  };

  const generateShareableLink = async () => {
    if (!activePage?.id) return;

    setIsGeneratingLink(true);
    try {
      const response = await pagesAPI.publicShare({
        pageId: activePage.id,
        allowDownload: false,
        isPublic: true,
        allowComments: currentShareSetting?.allowComments ?? false,
        expiresAt: currentShareSetting?.expiresAt ?? null,
      });

      if (response.status === 200 && response.data) {
        const publicLink = `${window.location.origin}/public/${response.data.publicShareId}`;

        setPreviousShareSettings({ ...currentShareSetting, isPublic: true, allowDownload: false });
        setCurrentShareSetting({ ...currentShareSetting, isPublic: true, allowDownload: false });
        setShareableLink(publicLink);
        copyToClipboard(publicLink);

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
    } catch {
      toast.error('Failed to regenerate link', { id: 'regenerate' });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const fetchSharedUsers = useCallback(async () => {
    if (!activePage?.id) return;

    setIsFetchingSharedUsers(true);

    try {
      const pageResponse = await pagesAPI.getPage(activePage.id);
      const page = pageResponse.data.Page;
      const sharedToIds = page.sharedTo || [];

      if (sharedToIds.length === 0) {
        setSharedUsers([]);
        return;
      }

      const userPromises = sharedToIds.map(async (userId) => {
        try {
          const userResponse = await authAPI.getUserById(userId);
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
    } catch (error) {
      if (handleUnauthorized(error)) return;
    } finally {
      setIsFetchingSharedUsers(false);
    }
  }, [activePage?.id]);

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
      const response = await pagesAPI.sharePage(activePage.id, newUserEmail.trim());

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

      if (apiUtils.isTimeoutError(error)) {
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
      const response = await pagesAPI.removeSharedUser(userEmail, activePage.id);
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

  React.useEffect(() => {
    if (isOpen && activePage) {
      getStatus();
      fetchSharedUsers();
    }
  }, [isOpen, activePage, getStatus, fetchSharedUsers]);

  if (!isOpen) return null;

  return (
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
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle hover:btn-error hover:text-black hover:scale-110 transition-all text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Content */}
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
                  <FiRefreshCw className={`w-4 h-4 ${isGeneratingLink ? 'animate-spin' : ''}`} />
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
                      checked={currentShareSetting.isPublic}
                      onChange={(e) =>
                        setCurrentShareSetting({
                          ...currentShareSetting,
                          isPublic: e.target.checked,
                        })
                      }
                    />
                    <div className="flex items-center gap-2">
                      <FiGlobe className="w-4 h-4" />
                      <span className="label-text font-medium">Public Access</span>
                    </div>
                  </label>
                  <p className="text-xs text-base-content/60 ml-8">Anyone with the link can view</p>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-secondary"
                      checked={currentShareSetting.allowDownload}
                      onChange={(e) =>
                        setCurrentShareSetting({
                          ...currentShareSetting,
                          allowDownload: e.target.checked,
                        })
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
              {!isFetchingSharedUsers && Array.isArray(sharedUsers) && sharedUsers.length > 0 && (
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
                            <span className="text-xs text-base-content/60">{sharedUser.email}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeSharedUser(sharedUser.email)}
                          className="btn btn-ghost btn-sm btn-circle hover:btn-error hover:scale-110 transition-all text-base-content/60 hover:text-black"
                          title="Remove access"
                        >
                          <FiX className="w-4 h-4 " />
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
                    <p className="text-xs mt-1 opacity-70">Enter an email above to start sharing</p>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 pt-5 flex justify-between items-center border-t border-base-300/60">
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
            <button onClick={onClose} className="btn btn-ghost rounded-xl">
              Close
            </button>
            <button
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="btn btn-primary gap-2 rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ShareModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  activePage: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
};

export default ShareModal;
