import { useState } from 'react';
import { FiShare2, FiSave, FiClock, FiFile, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import ShareModal from './ShareModal';
import propTypes from 'prop-types';

const TopBar = ({ activePage, onSave, lastSaved, saveStatus }) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const handleShare = () => {
    setShowShareModal(true);
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
      <div className="h-16 lg:h-20 bg-base-100 border-b border-base-300 hidden md:flex items-center justify-between px-4 lg:px-8 sticky top-16 z-30 shadow-sm">
        {/* Left Section - Enhanced Page Info */}
        <div className="flex items-center space-x-4 lg:space-x-6">
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
                {saveStatus === 'saving' && (
                  <div className="flex items-center space-x-2 text-warning">
                    <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Saving to server...</span>
                  </div>
                )}
                {saveStatus === 'synced' && (
                  <div className="flex items-center space-x-2 text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm font-medium">Synced with server</span>
                  </div>
                )}
                {saveStatus === 'cached' && (
                  <div className="flex items-center space-x-2 text-info">
                    <div className="w-2 h-2 bg-info rounded-full"></div>
                    <span className="text-sm font-medium">Saved locally</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center space-x-2 text-error">
                    <div className="w-2 h-2 bg-error rounded-full"></div>
                    <span className="text-sm font-medium">Save failed</span>
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
              <button
                onClick={onSave}
                className={`btn btn-sm gap-1 lg:gap-2 hover:scale-105 transition-all duration-200 rounded-xl ${
                  saveStatus === 'saving'
                    ? 'btn-warning loading'
                    : saveStatus === 'error'
                      ? 'btn-error'
                      : saveStatus === 'synced'
                        ? 'btn-success'
                        : saveStatus === 'cached'
                          ? 'btn-info'
                          : 'btn-ghost hover:btn-success'
                }`}
                disabled={saveStatus === 'saving'}
                title={
                  saveStatus === 'saving'
                    ? 'Saving to server...'
                    : saveStatus === 'error'
                      ? 'Save failed - click to retry'
                      : saveStatus === 'synced'
                        ? 'Synced with server'
                        : saveStatus === 'cached'
                          ? 'Saved locally'
                          : 'Save page (Ctrl+S)'
                }
              >
                {saveStatus === 'saving' ? (
                  <div className="loading loading-spinner loading-sm"></div>
                ) : saveStatus === 'error' ? (
                  <FiAlertTriangle className="w-4 h-4" />
                ) : saveStatus === 'synced' ? (
                  <FiCheck className="w-4 h-4" />
                ) : saveStatus === 'cached' ? (
                  <FiSave className="w-4 h-4" />
                ) : (
                  <FiSave className="w-4 h-4" />
                )}
                <span className="hidden sm:inline lg:inline">
                  {saveStatus === 'saving'
                    ? 'Saving...'
                    : saveStatus === 'error'
                      ? 'Retry'
                      : saveStatus === 'synced'
                        ? 'Synced'
                        : saveStatus === 'cached'
                          ? 'Saved'
                          : 'Save'}
                </span>
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

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        activePage={activePage}
      />
    </>
  );
};

TopBar.propTypes = {
  activePage: propTypes.object,
  onSave: propTypes.func.isRequired,
  onDelete: propTypes.func,
  onRename: propTypes.func,
  lastSaved: propTypes.string,
  saveStatus: propTypes.string,
};

export default TopBar;
