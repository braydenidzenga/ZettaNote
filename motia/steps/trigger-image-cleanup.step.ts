import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

const bodySchema = z.object({
    cleanupType: z.enum(['marked', 'orphaned', 'comprehensive']).optional().default('comprehensive'),
    batchSize: z.number().min(1).max(100).optional().default(50),
});

export const config: ApiRouteConfig = {
    type: 'api',
    name: 'TriggerImageCleanup',
    path: '/cleanup/images',
    method: 'POST',
    emits: ['cleanup-marked-images', 'cleanup-orphaned-images'],
    flows: ['image-management'],
    bodySchema,
    responseSchema: {
        200: z.object({
            message: z.string(),
            cleanupType: z.string(),
            jobId: z.string(),
        }),
        400: z.object({
            error: z.string(),
        }),
    },
};

export const handler: Handlers['TriggerImageCleanup'] = async (req, { emit, logger }) => {
    try {
        const { cleanupType, batchSize } = bodySchema.parse(req.body);

        const jobId = `cleanup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        logger.info('Starting image cleanup job', { jobId, cleanupType, batchSize });

        if (cleanupType === 'marked' || cleanupType === 'comprehensive') {
            await emit({
                topic: 'cleanup-marked-images',
                data: {
                    jobId,
                    batchSize,
                    cleanupType,
                },
            });
        }

        if (cleanupType === 'orphaned' || cleanupType === 'comprehensive') {
            await emit({
                topic: 'cleanup-orphaned-images',
                data: {
                    jobId,
                    cleanupType,
                },
            });
        }

        return {
            status: 200,
            body: {
                message: `Image cleanup job started: ${cleanupType}`,
                cleanupType,
                jobId,
            },
        };
    } catch (error) {
        logger.error('Failed to trigger image cleanup', { error: (error as Error).message });
        return {
            status: 400,
            body: { error: 'Invalid request data' },
        };
    }
};