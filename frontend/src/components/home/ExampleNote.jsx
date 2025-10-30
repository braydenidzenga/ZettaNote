import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ExampleNote = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [lastEdited, setLastEdited] = useState(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');

  const handleShare = () => {
    navigator.clipboard.writeText('https://zettanote.tech');
    toast.success('Link copied to clipboard!');
  };

  const handleEdit = () => {
    if (isEditing) {
      setLastEdited(new Date());
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    const updateRelativeTime = () => {
      const now = new Date();
      const seconds = Math.round((now - lastEdited) / 1000);
      const minutes = Math.round(seconds / 60);
      const hours = Math.round(minutes / 60);
      const days = Math.round(hours / 24);

      if (seconds < 10) {
        setTimeAgo('just now');
      } else if (minutes < 1) {
        setTimeAgo(`${seconds} seconds ago`);
      } else if (minutes < 60) {
        setTimeAgo(`${minutes} minutes ago`);
      } else if (hours < 24) {
        setTimeAgo(`${hours} hours ago`);
      } else {
        setTimeAgo(`${days} days ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastEdited]);

  return (
    <div className="max-w-xl mx-auto bg-[color:var(--color-base-100)] border border-[color:var(--color-base-300)] rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3
          className="text-base font-semibold text-[color:var(--color-base-content)]"
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
        >
          Meeting Notes — 12 Oct 2025
        </h3>
        <div className="text-sm text-[color:var(--color-neutral-content)]">
          Private • Edited {timeAgo}
        </div>
      </div>
     <p
  className="mt-3 text-sm text-[color:var(--color-neutral-content)] leading-relaxed min-h-48 max-h-80 overflow-y-auto p-3 rounded-md border border-[color:var(--color-base-300)] bg-[color:var(--color-base-200)]"
  contentEditable={isEditing}
  suppressContentEditableWarning={true}
>
        Quick summary: Decide migration plan for the frontend — start with a Vite parallel folder,
        migrate auth pages first, then dashboard. Public share will be read-only links.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          className="px-3 py-1 rounded-md text-sm border border-[color:var(--color-base-300)] cursor-pointer"
          onClick={handleEdit}
        >
          {isEditing ? 'Save' : 'Edit'}
        </button>
        <button
          className="px-3 py-1 rounded-md text-sm bg-[color:var(--color-primary)] text-[color:var(--color-primary-content)] cursor-pointer"
          onClick={handleShare}
        >
          Share (public)
        </button>
      </div>
    </div>
  );
};

export default ExampleNote;
