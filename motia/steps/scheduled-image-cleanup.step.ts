import { CronConfig, Handlers } from 'motia';

export const config: CronConfig = {
    type: 'cron',
    name: 'ScheduledImageCleanup',
    description: 'Scheduled comprehensive image cleanup every 6 hours',
    cron: '0 */6 * * *', // Every 6 hours
    emits: ['cleanup-marked-images', 'cleanup-orphaned-images'],
    flows: ['image-management'],
};

export const handler: Handlers['ScheduledImageCleanup'] = async ({ emit, logger }) => {
    const jobId = `scheduled-cleanup-${Date.now()}`;

    logger.info('Starting scheduled comprehensive image cleanup', { jobId });

    try {
        // Trigger comprehensive cleanup (both marked and orphaned)
        await emit({
            topic: 'cleanup-marked-images',
            data: {
                jobId: `${jobId}-marked`,
                batchSize: 50,
                cleanupType: 'comprehensive',
            },
        });

        await emit({
            topic: 'cleanup-orphaned-images',
            data: {
                jobId: `${jobId}-orphaned`,
                cleanupType: 'comprehensive',
            },
        });

        logger.info('Scheduled image cleanup jobs triggered successfully', { jobId });
    } catch (error) {
        logger.error('Failed to trigger scheduled image cleanup', {
            jobId,
            error: (error as Error).message,
        });
        throw error;
    }
};