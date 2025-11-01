/**
 * Task Reminder Worker
 * @description BullMQ worker for processing task reminder operations
 */

import { Worker } from 'bullmq';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import TaskModel from '../models/Task.model.js';
import {
  sendTaskReminderEmail,
  sendTaskOverdueEmail,
} from '../controllers/v1/mailer.controller.js';

/**
 * Redis connection configuration
 */
const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};

/**
 * Process task reminder job
 * @param {object} job - BullMQ job
 * @returns {object} Reminder result
 */
const processTaskReminder = async (job) => {
  const { checkType = 'all' } = job.data;

  logger.info('Processing task reminders', {
    jobId: job.id,
    checkType,
    attemptsMade: job.attemptsMade,
  });

  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourWindow = 5 * 60 * 1000;

    let oneHourReminders = 0;
    let overdueReminders = 0;

    // Check 1-hour reminders
    if (checkType === 'all' || checkType === 'one-hour') {
      const tasksNearing1Hour = await TaskModel.find({
        taskDeadline: {
          $gte: new Date(oneHourFromNow.getTime() - oneHourWindow),
          $lte: new Date(oneHourFromNow.getTime() + oneHourWindow),
        },
        isTaskCompleted: false,
        oneHourReminderSent: false,
      }).populate('owner');

      for (const task of tasksNearing1Hour) {
        logger.info(
          `Sending 1-hour reminder for task: ${task.taskName} to user: ${task.owner.email}`
        );
        const emailResult = await sendTaskReminderEmail(task, '1 hour');
        if (emailResult.success) {
          await TaskModel.findByIdAndUpdate(task._id, { oneHourReminderSent: true });
          oneHourReminders++;
        }
      }
    }

    // Check overdue reminders
    if (checkType === 'all' || checkType === 'overdue') {
      const overdueTasks = await TaskModel.find({
        taskDeadline: { $lt: now },
        isTaskCompleted: false,
        overdueReminderSent: false,
      }).populate('owner');

      for (const task of overdueTasks) {
        logger.info(
          `Sending overdue reminder for task: ${task.taskName} to user: ${task.owner.email}`
        );
        const emailResult = await sendTaskOverdueEmail(task);
        if (emailResult.success) {
          await TaskModel.findByIdAndUpdate(task._id, { overdueReminderSent: true });
          overdueReminders++;
        }
      }
    }

    logger.info('Task reminders completed successfully', {
      jobId: job.id,
      oneHourReminders,
      overdueReminders,
    });

    return {
      success: true,
      oneHourReminders,
      overdueReminders,
    };
  } catch (error) {
    logger.error('Task reminder processing failed', {
      jobId: job.id,
      error: error.message,
      attemptsMade: job.attemptsMade,
    });
    throw error; // Will trigger retry if attempts remain
  }
};

/**
 * Create and start the task reminder worker
 * @returns {Worker} BullMQ worker instance
 */
export const createTaskReminderWorker = () => {
  const worker = new Worker('task-reminder', processTaskReminder, {
    connection: redisConnection,
    concurrency: 1, // Process one reminder job at a time
  });

  // Event handlers
  worker.on('completed', (job, result) => {
    logger.info('Task reminder job completed', {
      jobId: job.id,
      oneHourReminders: result.oneHourReminders,
      overdueReminders: result.overdueReminders,
      duration: job.processedOn ? Date.now() - job.processedOn : 'N/A',
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Task reminder job failed permanently', {
      jobId: job?.id,
      error: err.message,
      attemptsMade: job?.attemptsMade,
    });
  });

  worker.on('error', (err) => {
    logger.error('Task reminder worker error:', err);
  });

  logger.info('✅ Task reminder worker started');
  return worker;
};

export default createTaskReminderWorker;
