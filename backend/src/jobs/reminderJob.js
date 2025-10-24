/**
 * Task Reminder Cron Job
 * @description Cron job to check for task deadline reminders and send email notifications
 */

import cron from 'node-cron';
import TaskModel from '../models/Task.model.js';
import logger from '../utils/logger.js';
import {
  sendTaskReminderEmail,
  sendTaskOverdueEmail,
} from '../controllers/v1/mailer.controller.js';

/**
 * Check for tasks with approaching deadlines
 * @description Checks for tasks due in 1 hour and overdue tasks, sends reminders
 */
const checkDeadlineReminders = async () => {
  try {
    const now = new Date();

    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourWindow = 5 * 60 * 1000;

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
        `Processing 1 hour reminder for task: ${task.taskName} to user: ${task.owner.email}`
      );

      const emailResult = await sendTaskReminderEmail(task, '1 hour');

      if (emailResult.success) {
        await TaskModel.findByIdAndUpdate(task._id, {
          oneHourReminderSent: true,
        });
      }
    }

    const overdueTasks = await TaskModel.find({
      taskDeadline: { $lt: now },
      isTaskCompleted: false,
      overdueReminderSent: false,
    }).populate('owner');

    for (const task of overdueTasks) {
      logger.info(
        `Processing overdue reminder for task: ${task.taskName} to user: ${task.owner.email}`
      );

      const emailResult = await sendTaskOverdueEmail(task);

      if (emailResult.success) {
        await TaskModel.findByIdAndUpdate(task._id, {
          overdueReminderSent: true,
        });
      }
    }
  } catch (error) {
    logger.error('Error checking deadline reminders:', error);
  }
};

/**
 * Start the reminder cron job
 * @description Starts a cron job that checks for deadline reminders every 5 minutes
 * @returns {ScheduledTask} Cron task instance
 */
export const startReminderCronJob = () => {
  logger.info('Starting reminder cron job...');

  // Run every 5 minutes: '*/5 * * * *'
  const task = cron.schedule(
    '*/5 * * * *',
    async () => {
      logger.info('Running scheduled reminder check...');
      try {
        await checkDeadlineReminders();
      } catch (error) {
        logger.error('Reminder cron job error:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );

  // Run immediately on startup
  checkDeadlineReminders().catch((error) => {
    logger.error('Initial reminder check error:', error);
  });

  logger.info('Reminder cron job started - running every 5 minutes');
  return task;
};

/**
 * Stop the reminder cron job
 * @description Stops the running reminder cron job
 * @param {ScheduledTask} task - The cron task to stop
 */
export const stopReminderCronJob = (task) => {
  if (task) {
    task.stop();
    logger.info('Reminder cron job stopped');
  }
};

export default {
  startReminderCronJob,
  stopReminderCronJob,
};
