import { FiPlus } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const CreateNewNoteModal = ({
  showCreateModal,
  setShowCreateModal,
  newPageName,
  setNewPageName,
  isCreating,
  setIsCreating,
  onCreatePage,
}) => {
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
      await onCreatePage(newPageName.trim());
      closeCreateModal();
    } catch (error) {
      // Error handling is done in the parent
      console.error('Error creating page:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    showCreateModal &&
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
                <p className="text-sm text-base-content/60">Give your page a memorable name</p>
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
                  {['Meeting Notes', 'Ideas', 'To-Do List', 'Project Plan', 'Daily Journal'].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setNewPageName(suggestion)}
                        className="btn btn-xs btn-ghost btn-outline hover:btn-primary"
                        disabled={isCreating}
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 pt-0 flex justify-end gap-3">
            <button onClick={closeCreateModal} className="btn btn-ghost" disabled={isCreating}>
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
    )
  );
};

export default CreateNewNoteModal;
