/**
 * Task Routes
 * @description Defines all routes related to task management operations
 */

import express from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import {
  createTask,
  getAllTasks,
  updateTask,
  getTaskById,
  deleteTask,
  toggleTaskCompletion,
} from '../controllers/task.controller.js';

const router = express.Router();

/**
 * POST /api/task/createTask
 * @description Route to create a new task
 * @access Private - Requires authentication
 */
router.post(
  '/createTask',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await createTask(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * PUT /api/task/updateTask
 * @description Route to update an existing task
 * @access Private - Requires authentication
 */
router.put(
  '/updateTask',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await updateTask(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/task/getTaskById
 * @description Route to get a specific task by ID
 * @access Private - Requires authentication
 */
router.get(
  '/getTaskById',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getTaskById(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * GET /api/task/getAllTasks
 * @description Route to get all tasks for authenticated user
 * @access Private - Requires authentication
 */
router.get(
  '/getAllTasks',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await getAllTasks(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * DELETE /api/task/deleteTask
 * @description Route to delete a task and all its subtasks
 * @access Private - Requires authentication
 */
router.delete(
  '/deleteTask',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await deleteTask(req);
    res.status(resStatus).json(resMessage);
  })
);

/**
 * PUT /api/task/toggleCompletion
 * @description Route to toggle task completion status
 * @access Private - Requires authentication
 */
router.put(
  '/toggleCompletion',
  asyncHandler(async (req, res) => {
    const { resStatus, resMessage } = await toggleTaskCompletion(req);
    res.status(resStatus).json(resMessage);
  })
);

export default router;
