import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { pagesAPI } from '../utils/api';

export const useImageUpload = (activePage, editorContent, onContentChange, addToHistory) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const uploadImage = useCallback(
    async (fileOrBase64, fileName = 'image') => {
      if (!activePage || !activePage.id) {
        toast.error('Please select an image or make sure a page is active');
        return;
      }

      try {
        setIsUploadingImage(true);
        const loadingToast = toast.loading(`Uploading ${fileName}...`);

        // Insert temporary placeholder
        const cursorPos = document.activeElement?.selectionStart || editorContent.length;
        const tempPlaceholder = `![Uploading ${fileName}...]()`;

        const newContent =
          editorContent.substring(0, cursorPos) +
          tempPlaceholder +
          editorContent.substring(cursorPos);

        onContentChange(newContent);

        // Upload the image
        const response = await pagesAPI.uploadImage(fileOrBase64, activePage.id);

        if (response.status === 200 && response.data && response.data.imageUrl) {
          // Replace placeholder with actual image markdown
          const imageMarkdown = `![${fileName}](${response.data.imageUrl})`;
          const updatedContent = newContent.replace(tempPlaceholder, imageMarkdown);

          onContentChange(updatedContent);
          addToHistory(updatedContent);

          toast.dismiss(loadingToast);
          toast.success('Image uploaded successfully');
        } else {
          throw new Error((response.data && response.data.message) || 'Upload failed');
        }
      } catch (error) {
        // Remove placeholder on error
        const tempPlaceholder = `![Uploading ${fileName}...]()`;
        const updatedContent = editorContent.replace(tempPlaceholder, '');
        onContentChange(updatedContent);

        toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`);
        console.error('Image upload error:', error);
      } finally {
        setIsUploadingImage(false);
      }
    },
    [activePage, editorContent, onContentChange, addToHistory]
  );

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        await uploadImage(reader.result, file.name);
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
      };
    };
    input.click();
  };

  // Handle clipboard paste events
  useEffect(() => {
    const handlePaste = async (e) => {
      // Only process if we have an active page and the textarea is focused
      if (!activePage || !activePage.id || !document.activeElement?.tagName === 'TEXTAREA') return;

      // Check if the clipboard contains image data
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Check if the item is an image
        if (item.type.indexOf('image') === 0) {
          // Prevent default paste behavior
          e.preventDefault();

          // Get the image blob
          const blob = item.getAsFile();
          if (!blob) continue;

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = async () => {
            await uploadImage(reader.result, 'pasted-image');
          };

          reader.onerror = () => {
            toast.error('Failed to read image data');
          };

          // Only process the first image
          break;
        }
      }
    };

    // Add paste event listener to the document
    document.addEventListener('paste', handlePaste);

    // Clean up the event listener when component unmounts
    return () => document.removeEventListener('paste', handlePaste);
  }, [activePage, uploadImage]);

  return {
    isUploadingImage,
    handleImageUpload,
  };
};
