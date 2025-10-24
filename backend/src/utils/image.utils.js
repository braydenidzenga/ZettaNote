import Image from '../models/Image.model.js';
import cloudinary from '../config/cloudinary.js';
import logger from './logger.js';

/**
 * Extract all image URLs from markdown content
 * @param {string} markdownContent - The markdown content to parse
 * @returns {string[]} Array of image URLs found in the content
 */
export const extractImageUrls = (markdownContent) => {
  if (!markdownContent) {
    return [];
  }

  // Match markdown image syntax: ![alt](url) or ![alt](url "title")
  const imageRegex = /!\[.*?\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const urls = [];
  let match;

  while ((match = imageRegex.exec(markdownContent)) !== null) {
    urls.push(match[1]); // Capture group 1 is the URL
  }

  return urls;
};

/**
 * Extract Cloudinary public IDs from image URLs
 * @param {string[]} urls - Array of image URLs
 * @returns {string[]} Array of public IDs
 */
export const extractPublicIds = (urls) => {
  return urls
    .filter((url) => url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))
    .map((url) => {
      // Extract public ID from Cloudinary URL
      // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
};

/**
 * Compare current content images with previously stored images
 * @param {string} currentContent - Current markdown content
 * @param {string[]} previousImageIds - Previously stored image public IDs
 * @returns {object} Object with added and removed image IDs
 */
export const compareContentImages = (currentContent, previousImageIds = []) => {
  const currentUrls = extractImageUrls(currentContent);
  const currentImageIds = extractPublicIds(currentUrls);

  const previousSet = new Set(previousImageIds);
  const currentSet = new Set(currentImageIds);

  const added = currentImageIds.filter((id) => !previousSet.has(id));
  const removed = previousImageIds.filter((id) => !currentSet.has(id));

  return { added, removed };
};

/**
 * Update image references for a page
 * @param {string} pageId - The page ID
 * @param {string[]} addedImageIds - Image IDs to add references to
 * @param {string[]} removedImageIds - Image IDs to remove references from
 */
export const updateImageReferences = async (pageId, addedImageIds = [], removedImageIds = []) => {
  try {
    // Add references for new images
    if (addedImageIds.length > 0) {
      await Image.updateMany(
        { publicId: { $in: addedImageIds } },
        {
          $addToSet: { usedInPages: pageId },
          $set: { lastUsedAt: new Date() },
        }
      );
    }

    // Remove references for deleted images
    if (removedImageIds.length > 0) {
      await Image.updateMany(
        { publicId: { $in: removedImageIds } },
        {
          $pull: { usedInPages: pageId },
          $set: { lastUsedAt: new Date() },
        }
      );

      // Mark images with no references for deletion
      await Image.updateMany(
        {
          publicId: { $in: removedImageIds },
          referenceCount: 0,
          status: 'active',
        },
        {
          $set: {
            status: 'marked_for_deletion',
            deleteAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours grace period
          },
        }
      );
    }

    logger.info(
      `Updated image references for page ${pageId}: +${addedImageIds.length} -${removedImageIds.length}`
    );
  } catch (error) {
    logger.error('Error updating image references:', error);
    throw error;
  }
};

/**
 * Get all image public IDs currently used in a page's content
 * @param {string} content - The page content
 * @returns {string[]} Array of public IDs
 */
export const getContentImageIds = (content) => {
  const urls = extractImageUrls(content);
  return extractPublicIds(urls);
};

/**
 * Clean up images marked for deletion
 * @param {number} batchSize - Number of images to process at once
 * @returns {object} Cleanup results
 */
export const cleanupMarkedImages = async (batchSize = 10) => {
  try {
    const imagesToDelete = await Image.find({
      status: 'marked_for_deletion',
      deleteAt: { $lte: new Date() },
    }).limit(batchSize);

    let deletedCount = 0;
    let failedCount = 0;

    for (const image of imagesToDelete) {
      try {
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(image.publicId);

        // Mark as deleted in database
        image.status = 'deleted';
        image.deleteAt = new Date();
        await image.save();

        deletedCount++;
        logger.info(`Deleted image: ${image.publicId}`);
      } catch (error) {
        logger.error(`Failed to delete image ${image.publicId}:`, error);
        failedCount++;
      }
    }

    return { deletedCount, failedCount, totalProcessed: imagesToDelete.length };
  } catch (error) {
    logger.error('Error in cleanupMarkedImages:', error);
    throw error;
  }
};

/**
 * Find and mark orphaned images (no references)
 * @returns {number} Number of orphaned images found
 */
export const markOrphanedImages = async () => {
  try {
    const orphanedImages = await Image.find({
      referenceCount: 0,
      status: 'active',
    });

    let markedCount = 0;
    for (const image of orphanedImages) {
      await image.markForDeletion(24); // 24 hour grace period
      markedCount++;
    }

    logger.info(`Marked ${markedCount} orphaned images for deletion`);
    return markedCount;
  } catch (error) {
    logger.error('Error marking orphaned images:', error);
    throw error;
  }
};
