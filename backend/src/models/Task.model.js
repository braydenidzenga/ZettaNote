/**
 * Task Model
 * @description Defines the MongoDB schema for tasks and subtasks with parent-child relationships
 */

import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
  },
  taskDescription: {
    type: String,
    required: false,
    default: '',
  },
  owner: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  taskDeadline: {
    type: Date,
    required: false,
    default: null,
  },
  isTaskCompleted: {
    type: Boolean,
    required: false,
    default: false,
  },
  parentTaskId: {
    type: mongoose.Types.ObjectId,
    required: false,
    default: null,
    ref: 'Task',
  },
  completedAt: {
    type: Date,
    required: false,
    default: null,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  oneHourReminderSent: {
    type: Boolean,
    default: false,
  },
  overdueReminderSent: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model('Task', TaskSchema);