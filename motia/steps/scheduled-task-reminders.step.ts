import { CronConfig, Handlers } from 'motia';

export const config: CronConfig = {
    type: 'cron',
    name: 'ScheduledTaskReminders',
    description: 'Scheduled task reminder check every 5 minutes',
    cron: '*/5 * * * *', // Every 5 minutes
    emits: ['send-task-reminders'],
    flows: ['task-management'],
};

export const handler: Handlers['ScheduledTaskReminders'] = async ({ emit, logger }) => {
    const jobId = `scheduled-reminder-${Date.now()}`;

    logger.info('Starting scheduled task reminder check', { jobId });

    try {
        await emit({
            topic: 'send-task-reminders',
            data: {
                jobId,
                checkType: 'all',
            },
        });

        logger.info('Scheduled task reminder check triggered successfully', { jobId });
    } catch (error) {
        logger.error('Failed to trigger scheduled task reminders', {
            jobId,
            error: (error as Error).message,
        });
        throw error;
    }
};