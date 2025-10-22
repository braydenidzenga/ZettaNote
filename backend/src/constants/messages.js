/**
 * Response Messages
 * Standardized messages for API responses
 */

export const MESSAGES = {
  // Auth Messages
  AUTH: {
    SIGNUP_SUCCESS: 'Account created successfully',
    LOGIN_SUCCESS: 'Logged in successfully',
    LOGOUT_SUCCESS: 'Logged out successfully',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User already exists with this email',
    USER_NOT_FOUND: 'User not found',
    PASSWORD_CHANGED: 'Password changed successfully',
    INCORRECT_PASSWORD: 'Current password is incorrect',
    ACCOUNT_TERMINATED: 'Account terminated successfully',
    UNAUTHORIZED: 'No token, authorization denied',
    INVALID_TOKEN: 'Invalid or expired token',
    ACCOUNT_FOUND: 'Account found successfully',
    USER_UPDATED: 'User updated successfully',
    AVATAR_ADDED: 'Avatar added successfully',
  },

  // Page Messages
  PAGE: {
    CREATED: 'Page created successfully',
    UPDATED: 'Page updated successfully',
    DELETED: 'Page deleted successfully',
    RENAMED: 'Page renamed successfully',
    NOT_FOUND: 'Page not found',
    ACCESS_DENIED: 'You do not have access to this page',
    SHARED: 'Page shared successfully',
    UNSHARED: 'Page unshared successfully',
    SHARE_SELF_NOT_ALLOWED: 'You cannot share page with yourself',
  },

  // Admin Messages
  ADMIN: {
    LOGIN_SUCCESS: 'Admin logged in successfully',
    LOGOUT_SUCCESS: 'Admin logged out successfully',
    CREATED: 'Admin created successfully',
    UPDATED: 'Admin updated successfully',
    DELETED: 'Admin deleted successfully',
    NOT_FOUND: 'Admin not found',
    INVALID_CREDENTIALS: 'Invalid admin credentials',
    PASSWORD_CHANGED: 'Admin password changed successfully',
    USER_BANNED: 'User banned successfully',
    USER_UNBANNED: 'User unbanned successfully',
    UNAUTHORIZED: 'Admin authorization required',
  },

  // General Messages
  GENERAL: {
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Bad request',
    SUCCESS: 'Operation successful',
  },

  // Task Messages
  TASK: {
    CREATED: 'Task created successfully',
    UPDATED: 'Task updated successfully',
    DELETED: 'Task deleted successfully',
    COMPLETED: 'Task marked as completed',
    UNCOMPLETED: 'Task marked as incomplete',
    NOT_FOUND: 'Task not found',
    ACCESS_DENIED: 'You do not have access to this task',
  },
};

export default MESSAGES;
