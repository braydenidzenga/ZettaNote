import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

const bodySchema = z.object({
  pageId: z.string().min(1, 'Page ID is required'),
  newPageData: z.string().min(0, 'Page data is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'AsyncPageSave',
  path: '/pages/save',
  method: 'POST',
  emits: ['process-page-save'],
  flows: ['page-management'],
  bodySchema,
  responseSchema: {
    202: z.object({
      message: z.string(),
      jobId: z.string(),
      pageId: z.string(),
    }),
    400: z.object({
      error: z.string(),
    }),
  },
};

export const handler: Handlers['AsyncPageSave'] = async (req, { emit, logger }) => {
  try {
    const { pageId, newPageData, userId } = bodySchema.parse(req.body);

    const jobId = `page-save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Starting async page save', { jobId, pageId, userId });

    await emit({
      topic: 'process-page-save',
      data: {
        jobId,
        pageId,
        newPageData,
        userId,
      },
    });

    return {
      status: 202, // Accepted - processing asynchronously
      body: {
        message: 'Page save job queued for processing',
        jobId,
        pageId,
      },
    };
  } catch (error) {
    logger.error('Failed to queue page save', { error: (error as Error).message });
    return {
      status: 400,
      body: { error: 'Invalid request data' },
    };
  }
};
