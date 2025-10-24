import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import axios from 'axios';

const inputSchema = z.object({
  jobId: z.string(),
  cleanupType: z.string(),
});

export const config: EventConfig = {
  type: 'event',
  name: 'CleanupOrphanedImages',
  description: 'Finds and marks orphaned images for deletion',
  subscribes: ['cleanup-orphaned-images'],
  emits: [],
  input: inputSchema,
  flows: ['image-management'],
};

export const handler: Handlers['CleanupOrphanedImages'] = async (input, { logger, state }) => {
  const { jobId, cleanupType } = input;

  try {
    logger.info('Starting orphaned images detection', { jobId, cleanupType });

    // Call backend API to mark orphaned images
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    const response = await axios.post(
      `${backendUrl}/api/cleanup/orphaned-images`,
      {
        jobId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 5 minutes timeout
      }
    );

    const result = response.data;

    logger.info('Orphaned images detection completed', {
      jobId,
      markedCount: result.markedCount,
    });

    // Store cleanup results in state for monitoring
    await state.set('cleanup-jobs', jobId, {
      type: 'orphaned-images',
      status: 'completed',
      result,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to detect orphaned images', {
      jobId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    // Store failure in state
    await state.set('cleanup-jobs', jobId, {
      type: 'orphaned-images',
      status: 'failed',
      error: (error as Error).message,
      failedAt: new Date().toISOString(),
    });

    throw error;
  }
};
