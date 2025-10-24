import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

const bodySchema = z.object({
  image: z.string().min(1, 'Image data is required'),
  originalName: z.string().optional(),
  pageId: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
});

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AsyncImageUpload',
  path: '/images/upload',
  method: 'POST',
  emits: ['process-image-upload'],
  flows: ['image-management'],
  bodySchema,
  responseSchema: {
    202: z.object({
      message: z.string(),
      jobId: z.string(),
    }),
    400: z.object({
      error: z.string(),
    }),
  },
};

export const handler: Handlers['AsyncImageUpload'] = async (req, { emit, logger }) => {
  try {
    const { image, originalName, pageId, userId } = bodySchema.parse(req.body);

    const jobId = `image-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Starting async image upload', { jobId, userId, pageId: pageId || 'none' });

    await emit({
      topic: 'process-image-upload',
      data: {
        jobId,
        image,
        originalName,
        pageId,
        userId,
      },
    });

    return {
      status: 202, // Accepted - processing asynchronously
      body: {
        message: 'Image upload job queued for processing',
        jobId,
      },
    };
  } catch (error) {
    logger.error('Failed to queue image upload', { error: (error as Error).message });
    return {
      status: 400,
      body: { error: 'Invalid request data' },
    };
  }
};
