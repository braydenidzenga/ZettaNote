import { STATUS_CODES } from '../../constants/statusCodes.js';
import TaskModel from '../../models/Task.model.js';
import { MESSAGES } from '../../constants/messages.js';
import { verifyToken } from '../../utils/token.utils.js';
import logger from '../../utils/logger.js';
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskIdSchema,
  toggleTaskCompletionSchema,
} from '../../utils/validator.utils.js';

/**
 * Create a new task
 * @description Creates a new task with optional parent task relationship
 * @param {object} req - Express request object containing task details
 * @returns {object} Response with status and created task data
 */
export const createTask = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      };
    }

    const { taskName, taskDescription, taskDeadline, parentTaskId } = parseResult.data;

    if (taskDeadline) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const deadlineDate = new Date(taskDeadline);
      deadlineDate.setHours(0, 0, 0, 0);

      if (deadlineDate < now) {
        return {
          resStatus: STATUS_CODES.BAD_REQUEST,
          resMessage: {
            message: 'Deadline cannot be in the past.',
          },
        };
      }
    }

    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    if (parentTaskId) {
      const parentTask = await TaskModel.findById(parentTaskId);
      if (!parentTask) {
        return {
          resStatus: STATUS_CODES.NOT_FOUND,
          resMessage: { message: MESSAGES.TASK.NOT_FOUND },
        };
      }
    }

    const newTask = new TaskModel({
      taskName,
      taskDescription: taskDescription || '',
      owner: user._id,
      taskDeadline: taskDeadline || null,
      parentTaskId: parentTaskId || null,
      isTaskCompleted: false,
      completedAt: null,
      createdAt: Date.now(),
    });

    await newTask.save();

    return {
      resStatus: STATUS_CODES.CREATED,
      resMessage: {
        message: MESSAGES.TASK.CREATED,
        Task: newTask,
      },
    };
  } catch (err) {
    logger.error('Create task error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Update an existing task

 * @description Updates task details including name, description, deadline, and completion status
 * @param {object} req - Express request object containing updated task details
 * @returns {object} Response with status and updated task data
 */
export const updateTask = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          message: parseResult.error.errors.map((e) => e.message).join(', '),
        },
      };
    }

    const { taskId, taskName, taskDescription, taskDeadline, isTaskCompleted } = parseResult.data;
    logger.info(JSON.stringify(parseResult.data));

    if (taskDeadline) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const deadlineDate = new Date(taskDeadline);
      deadlineDate.setHours(0, 0, 0, 0);

      if (deadlineDate < now) {
        return {
          resStatus: STATUS_CODES.BAD_REQUEST,
          resMessage: {
            message: 'Deadline cannot be in the past.',
          },
        };
      }
    }

    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    const task = await TaskModel.findById(taskId);
    logger.info(task);
    if (!task) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: MESSAGES.TASK.NOT_FOUND },
      };
    }

    if (!task.owner.equals(user._id)) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.TASK.ACCESS_DENIED },
      };
    }

    task.taskName = taskName;
    task.taskDescription = taskDescription;
    task.taskDeadline = taskDeadline;
    task.isTaskCompleted = isTaskCompleted;

    await task.save();

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        message: MESSAGES.TASK.UPDATED,
        Task: task,
      },
    };
  } catch (err) {
    logger.error('Update task error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Get a specific task by ID
 * @description Retrieves a single task by its ID with ownership verification
 * @param {object} req - Express request object containing task ID
 * @returns {object} Response with status and task data
 */
export const getTaskById = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    const parseResult = getTaskIdSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }

    const { taskId } = parseResult.data;
    logger.info(JSON.stringify(parseResult.data));

    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: MESSAGES.TASK.NOT_FOUND },
      };
    }
    if (!task.owner.equals(user._id)) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.TASK.ACCESS_DENIED },
      };
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        Task: task,
      },
    };
  } catch (err) {
    logger.error('Get task by id error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Get all tasks for authenticated user
 * @description Retrieves all tasks belonging to the authenticated user, grouped by parent-subtask relationships
 * @param {object} req - Express request object
 * @returns {object} Response with status and grouped tasks data
 */
export const getAllTasks = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    const tasks = await TaskModel.find({ owner: user._id });
    const parentTasks = [];
    const subtasksByParent = {};

    for (const task of tasks) {
      if (!task.parentTaskId) {
        parentTasks.push(task);
      } else {
        const parentId = task.parentTaskId.toString();
        if (!subtasksByParent[parentId]) {
          subtasksByParent[parentId] = [];
        }
        subtasksByParent[parentId].push(task);
      }
    }
    const groupedTasks = parentTasks.map((task) => {
      const taskObject = task.toObject();
      taskObject.subtasks = subtasksByParent[task._id.toString()] || [];
      return taskObject;
    });
    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        Tasks: groupedTasks,
      },
    };
  } catch (err) {
    logger.error('Get tasks error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Delete a task and its subtasks
 * @description Deletes a task and cascades deletion to all subtasks if it's a parent task
 * @param {object} req - Express request object containing task ID
 * @returns {object} Response with status and confirmation message
 */
export const deleteTask = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    const parseResult = getTaskIdSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }

    const { taskId } = parseResult.data;
    logger.info(JSON.stringify(parseResult.data));

    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    const taskToDelete = await TaskModel.findById(taskId);
    if (!taskToDelete) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: MESSAGES.TASK.NOT_FOUND },
      };
    }
    if (!taskToDelete.owner.equals(user._id)) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.TASK.ACCESS_DENIED },
      };
    }

    // If deleting a parent task, delete all its subtasks first
    if (!taskToDelete.parentTaskId) {
      const deletedSubtasks = await TaskModel.deleteMany({
        parentTaskId: taskId,
        owner: user._id,
      });
      if (deletedSubtasks.deletedCount > 0) {
        logger.info(`Deleted ${deletedSubtasks.deletedCount} subtasks for parent task ${taskId}`);
      }
    }

    const taskDeleted = await TaskModel.findByIdAndDelete(taskId);
    if (!taskDeleted) {
      return {
        resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
        resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
      };
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        message: MESSAGES.TASK.DELETED,
      },
    };
  } catch (err) {
    logger.error('Delete page error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

/**
 * Toggle task completion status
 * @description Toggles the completion status of a task (completed <-> incomplete)
 * @param {object} req - Express request object
 * @returns {object} Response with status and message
 */
export const toggleTaskCompletion = async (req) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.UNAUTHORIZED },
      };
    }

    const parseResult = toggleTaskCompletionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: { message: parseResult.error.errors.map((e) => e.message).join(', ') },
      };
    }

    const { taskId } = parseResult.data;

    const user = await verifyToken(token);
    if (!user) {
      return {
        resStatus: STATUS_CODES.UNAUTHORIZED,
        resMessage: { message: MESSAGES.AUTH.INVALID_TOKEN },
      };
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      return {
        resStatus: STATUS_CODES.NOT_FOUND,
        resMessage: { message: MESSAGES.TASK.NOT_FOUND },
      };
    }

    if (!task.owner.equals(user._id)) {
      return {
        resStatus: STATUS_CODES.FORBIDDEN,
        resMessage: { message: MESSAGES.TASK.ACCESS_DENIED },
      };
    }

    // Toggle completion status
    task.isTaskCompleted = !task.isTaskCompleted;
    task.completedAt = task.isTaskCompleted ? new Date() : null;

    await task.save();

    // If marking parent task as completed, complete all subtasks
    if (task.isTaskCompleted && !task.parentTaskId) {
      const subtasks = await TaskModel.find({
        parentTaskId: task._id,
        owner: user._id,
      });

      if (subtasks.length > 0) {
        await TaskModel.updateMany(
          {
            parentTaskId: task._id,
            owner: user._id,
          },
          {
            isTaskCompleted: true,
            completedAt: new Date(),
          }
        );
        logger.info(`Completed ${subtasks.length} subtasks for parent task ${task._id}`);
      }
    }

    return {
      resStatus: STATUS_CODES.OK,
      resMessage: {
        message: task.isTaskCompleted ? MESSAGES.TASK.COMPLETED : MESSAGES.TASK.UNCOMPLETED,
        Task: task,
      },
    };
  } catch (err) {
    logger.error('Toggle task completion error', err);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: { message: MESSAGES.GENERAL.SERVER_ERROR },
    };
  }
};

export default {
  createTask,
  getAllTasks,
  updateTask,
  getTaskById,
  deleteTask,
  toggleTaskCompletion,
};
