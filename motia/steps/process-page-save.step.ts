import { EventConfig, Handlers } from 'motia';
import { z } from 'zod';
import axios from 'axios';

const inputSchema = z.object({
    jobId: z.string(),
    pageId: z.string(),
    newPageData: z.string(),
    userId: z.string(),
});

export const config: EventConfig = {
    type: 'event',
    name: 'ProcessPageSave',
    description: 'Processes page save operations including image reference updates and cache management',
    subscribes: ['process-page-save'],
    emits: [],
    input: inputSchema,
    flows: ['page-management'],
};

export const handler: Handlers['ProcessPageSave'] = async (input, { logger, state }) => {
    const { jobId, pageId, newPageData, userId } = input;

    try {
        logger.info('Processing page save', { jobId, pageId, userId });

        // Call backend API to perform the actual page save
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        const response = await axios.post(`${backendUrl}/api/pages/save-async`, {
            jobId,
            pageId,
            newPageData,
            userId,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 60000, // 1 minute timeout for page operations
        });

        const result = response.data;

        logger.info('Page save completed successfully', {
            jobId,
            pageId,
            userId,
            updated: result.updated,
        });

        // Store save results in state for monitoring
        await state.set('page-save-jobs', jobId, {
            type: 'page-save',
            status: 'completed',
            result,
            pageId,
            userId,
            completedAt: new Date().toISOString(),
        });

    } catch (error) {
        logger.error('Failed to process page save', {
            jobId,
            pageId,
            userId,
            error: (error as Error).message,
            stack: (error as Error).stack,
        });

        // Store failure in state
        await state.set('page-save-jobs', jobId, {
            type: 'page-save',
            status: 'failed',
            error: (error as Error).message,
            pageId,
            userId,
            failedAt: new Date().toISOString(),
        });

        throw error;
    }
};