import { FiTrash2 } from 'react-icons/fi';
import { createPortal } from 'react-dom';

const DeleteNoteModal = ({
  showDeleteModal,
  setShowDeleteModal,
  pageToDelete,
  isDeleting,
  onDeletePage,
}) => {
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDelete = async () => {
    try {
      await onDeletePage(pageToDelete._id, pageToDelete.title);
      closeDeleteModal();
    } catch (error) {
      // Error handling is done in the parent
      console.error('Error deleting page:', error);
    }
  };

  return (
    showDeleteModal &&
    createPortal(
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={closeDeleteModal}
      >
        <div
          className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-lg">
                <FiTrash2 className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-base-content">Delete Page</h3>
                <p className="text-sm text-base-content/60">This action cannot be undone</p>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                <p className="text-sm text-base-content">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-error">
                    &quot;{pageToDelete?.title}&quot;
                  </span>
                  ?
                </p>
                <p className="text-xs text-base-content/60 mt-2">
                  This will permanently remove the page and all its content. This action cannot be
                  undone.
                </p>
              </div>

              {/* Page Details */}
              <div className="bg-base-200/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-base-300 rounded-lg flex items-center justify-center">
                    <FiTrash2 className="w-4 h-4 text-base-content/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-content truncate">
                      {pageToDelete?.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-base-content/60">
                      Created{' '}
                      {pageToDelete?.createdAt
                        ? new Date(pageToDelete.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'recently'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 pt-0 flex justify-end gap-3">
            <button onClick={closeDeleteModal} className="btn btn-ghost" disabled={isDeleting}>
              Cancel
            </button>
            <button onClick={handleDelete} className="btn btn-error gap-2" disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 className="w-4 h-4" />
                  Delete Page
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

export default DeleteNoteModal;
