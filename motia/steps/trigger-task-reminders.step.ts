import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';

const bodySchema = z.object({
  checkType: z.enum(['all', 'one-hour', 'overdue']).optional().default('all'),
});

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'TriggerTaskReminders',
  path: '/reminders/tasks',
  method: 'POST',
  emits: ['send-task-reminders'],
  flows: ['task-management'],
  bodySchema,
  responseSchema: {
    200: z.object({
      message: z.string(),
      checkType: z.string(),
      jobId: z.string(),
    }),
    400: z.object({
      error: z.string(),
    }),
  },
};

export const handler: Handlers['TriggerTaskReminders'] = async (req, { emit, logger }) => {
  try {
    const { checkType } = bodySchema.parse(req.body);

    const jobId = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    logger.info('Starting task reminder check', { jobId, checkType });

    await emit({
      topic: 'send-task-reminders',
      data: {
        jobId,
        checkType,
      },
    });

    return {
      status: 200,
      body: {
        message: `Task reminder check started: ${checkType}`,
        checkType,
        jobId,
      },
    };
  } catch (error) {
    logger.error('Failed to trigger task reminders', { error: (error as Error).message });
    return {
      status: 400,
      body: { error: 'Invalid request data' },
    };
  }
};
