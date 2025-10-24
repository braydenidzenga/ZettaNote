import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import axios from 'axios';

const inputSchema = z.object({
  jobId: z.string(),
  batchSize: z.number().min(1).max(100),
  cleanupType: z.string(),
});

export const config: EventConfig = {
  type: 'event',
  name: 'CleanupMarkedImages',
  description: 'Deletes images from Cloudinary that are marked for deletion',
  subscribes: ['cleanup-marked-images'],
  emits: [],
  input: inputSchema,
  flows: ['image-management'],
};

export const handler: Handlers['CleanupMarkedImages'] = async (input, { logger, state }) => {
  const { jobId, batchSize, cleanupType } = input;

  try {
    logger.info('Starting cleanup of marked images', { jobId, batchSize, cleanupType });

    // Call backend API to get and cleanup marked images
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    const response = await axios.post(
      `${backendUrl}/api/cleanup/marked-images`,
      {
        batchSize,
        jobId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if needed
        },
        timeout: 300000, // 5 minutes timeout for heavy operations
      }
    );

    const result = response.data;

    logger.info('Marked images cleanup completed', {
      jobId,
      deletedCount: result.deletedCount,
      failedCount: result.failedCount,
      totalProcessed: result.totalProcessed,
    });

    // Store cleanup results in state for monitoring
    await state.set('cleanup-jobs', jobId, {
      type: 'marked-images',
      status: 'completed',
      result,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to cleanup marked images', {
      jobId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    // Store failure in state
    await state.set('cleanup-jobs', jobId, {
      type: 'marked-images',
      status: 'failed',
      error: (error as Error).message,
      failedAt: new Date().toISOString(),
    });

    throw error; // Re-throw to let Motia handle retry logic if configured
  }
};
