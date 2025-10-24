import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import axios from 'axios';

const inputSchema = z.object({
  jobId: z.string(),
  image: z.string(),
  originalName: z.string().optional(),
  pageId: z.string().optional(),
  userId: z.string(),
});

export const config: EventConfig = {
  type: 'event',
  name: 'ProcessImageUpload',
  description: 'Processes image upload to Cloudinary and saves metadata to database',
  subscribes: ['process-image-upload'],
  emits: [],
  input: inputSchema,
  flows: ['image-management'],
};

export const handler: Handlers['ProcessImageUpload'] = async (input, { logger, state }) => {
  const { jobId, image, originalName, pageId, userId } = input;

  try {
    logger.info('Processing image upload', { jobId, userId, pageId: pageId || 'none' });

    // Call backend API to perform the actual image upload
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

    const response = await axios.post(
      `${backendUrl}/api/images/upload-async`,
      {
        jobId,
        image,
        originalName,
        pageId,
        userId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes timeout for image uploads
      }
    );

    const result = response.data;

    logger.info('Image upload completed successfully', {
      jobId,
      userId,
      imageId: result.imageId,
      imageUrl: result.imageUrl,
    });

    // Store upload results in state for monitoring
    await state.set('image-upload-jobs', jobId, {
      type: 'image-upload',
      status: 'completed',
      result,
      userId,
      pageId,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to process image upload', {
      jobId,
      userId,
      pageId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    // Store failure in state
    await state.set('image-upload-jobs', jobId, {
      type: 'image-upload',
      status: 'failed',
      error: (error as Error).message,
      userId,
      pageId,
      failedAt: new Date().toISOString(),
    });

    throw error;
  }
};
