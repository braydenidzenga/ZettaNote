import axios from 'axios';
import logger from './logger.js';

/**
 * Configuration for Motia integration
 */
const MOTIA_CONFIG = {
  enabled: process.env.USE_MOTIA === 'true',
  baseUrl: process.env.MOTIA_URL || 'http://localhost:3001',
  timeout: 5000, // 5 seconds for initial trigger
};

/**
 * Trigger async page save via Motia
 * @param {string} pageId - The page ID to save
 * @param {string} newPageData - The new page content
 * @param {string} userId - The user ID performing the save
 * @returns {Promise<{success: boolean, jobId?: string, error?: string}>} Result of the trigger
 */
const triggerAsyncPageSave = async (pageId, newPageData, userId) => {
  try {
    const response = await axios.post(
      `${MOTIA_CONFIG.baseUrl}/pages/save`,
      {
        pageId,
        newPageData,
        userId,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: MOTIA_CONFIG.timeout,
      }
    );

    return {
      success: true,
      jobId: response.data.body?.jobId,
    };
  } catch (error) {
    logger.error('Failed to trigger async page save:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export { MOTIA_CONFIG, triggerAsyncPageSave };
