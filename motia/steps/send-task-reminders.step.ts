import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import axios from 'axios';

const inputSchema = z.object({
    jobId: z.string(),
    checkType: z.string(),
});

export const config: EventConfig = {
    type: 'event',
    name: 'SendTaskReminders',
    description: 'Checks for tasks nearing deadline and sends reminder emails',
    subscribes: ['send-task-reminders'],
    emits: [],
    input: inputSchema,
    flows: ['task-management'],
};

export const handler: Handlers['SendTaskReminders'] = async (input, { logger, state }) => {
    const { jobId, checkType } = input;

    try {
        logger.info('Starting task reminder check', { jobId, checkType });

        // Call backend API to check and send reminders
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        const response = await axios.post(`${backendUrl}/api/reminders/check`, {
            jobId,
            checkType,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 120000, // 2 minutes timeout
        });

        const result = response.data;

        logger.info('Task reminder check completed', {
            jobId,
            oneHourReminders: result.oneHourReminders || 0,
            overdueReminders: result.overdueReminders || 0,
        });

        // Store reminder results in state for monitoring
        await state.set('reminder-jobs', jobId, {
            type: 'task-reminders',
            status: 'completed',
            result,
            completedAt: new Date().toISOString(),
        });

    } catch (error) {
        logger.error('Failed to send task reminders', {
            jobId,
            error: (error as Error).message,
            stack: (error as Error).stack,
        });

        // Store failure in state
        await state.set('reminder-jobs', jobId, {
            type: 'task-reminders',
            status: 'failed',
            error: (error as Error).message,
            failedAt: new Date().toISOString(),
        });

        throw error;
    }
};