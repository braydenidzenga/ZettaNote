import { useState, useEffect, useContext, useCallback } from 'react';
import { FiBell, FiX, FiPlus, FiClock, FiCheck } from 'react-icons/fi';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { tasksAPI, apiUtils } from '../../utils/api';
import authContext from '../../context/AuthProvider';

const Reminder = ({ isOpen, onClose }) => {
  const { user, setuser } = useContext(authContext);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingReminder, setAddingReminder] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
  });

  const fetchTasks = useCallback(async () => {
    if (!user) {
      //   console.error('No user found, cannot fetch tasks');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await tasksAPI.getAllTasks();

      if (response.data && response.data.Tasks && Array.isArray(response.data.Tasks)) {
        const transformedTasks = response.data.Tasks.map((task) => ({
          id: task._id,
          title: task.taskName,
          description: task.taskDescription || '',
          dueDate: task.taskDeadline ? new Date(task.taskDeadline) : new Date(),
          completed: task.isTaskCompleted,
          createdAt: new Date(task.createdAt),
        }));

        setReminders(transformedTasks);
      } else {
        console.error('No tasks found in response or invalid format');
        setReminders([]);
      }
    } catch (error) {
      if (
        apiUtils.handleUnauthorized(error, () => {
          setuser(null);
          localStorage.removeItem('zetta_user');
          toast.error('Session expired. Please login again.');
          onClose();
        })
      )
        return;
      console.error('Error fetching tasks:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load reminders');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [user, setuser, onClose]);

  useEffect(() => {
    if (isOpen && user) {
      fetchTasks();
    }
  }, [isOpen, user, fetchTasks]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const formatDeadline = (dueDate) => {
    const now = new Date();
    const diffMs = dueDate - now;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const overdueDays = Math.abs(diffDays);
      const overdueHours = Math.abs(diffHours) % 24;
      const overdueMinutes = Math.abs(diffMinutes) % 60;

      if (overdueDays > 0) {
        return `${overdueDays}d ${overdueHours}h overdue`;
      } else if (overdueHours > 0) {
        return `${overdueHours}h ${overdueMinutes}m overdue`;
      } else {
        return `${overdueMinutes}m overdue`;
      }
    }

    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      return `${diffDays}d ${remainingHours}h left`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      return `${diffHours}h ${remainingMinutes}m left`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m left`;
    } else {
      return 'Due now';
    }
  };

  const getReminderStyle = (reminder) => {
    if (reminder.completed) return 'bg-success/10 border-success/20';

    const now = new Date();
    const diffMs = reminder.dueDate - now;

    if (diffMs < 0) return 'bg-error/10 border-error/20';
    if (diffMs < 2 * 60 * 60 * 1000) return 'bg-warning/10 border-warning/20';
    return 'bg-base-200/50 border-base-300/50';
  };

  const getTextColor = (reminder) => {
    if (reminder.completed) return 'text-success/70 line-through';

    const now = new Date();
    const diffMs = reminder.dueDate - now;

    if (diffMs < 0) return 'text-error';
    if (diffMs < 2 * 60 * 60 * 1000) return 'text-warning';
    return 'text-base-content';
  };

  const getDescriptionColor = (reminder) => {
    if (reminder.completed) return 'text-success/50 line-through';
    return 'text-base-content/60';
  };

  const getTimeColor = (reminder) => {
    if (reminder.completed) return 'text-success/60 line-through';

    const now = new Date();
    const diffMs = reminder.dueDate - now;

    if (diffMs < 0) return 'text-error';
    if (diffMs < 2 * 60 * 60 * 1000) return 'text-warning';
    return 'text-base-content/60';
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) {
      toast.error('Please enter a reminder title');
      return;
    }

    try {
      setAddingReminder(true);
      let dueDateTime = null;
      if (newReminder.dueDate) {
        dueDateTime = new Date(newReminder.dueDate);
        if (newReminder.dueTime) {
          const [hours, minutes] = newReminder.dueTime.split(':');
          dueDateTime.setHours(parseInt(hours), parseInt(minutes));
        } else {
          dueDateTime.setHours(23, 59, 59);
        }
      }

      const taskData = {
        taskName: newReminder.title.trim(),
        taskDescription: newReminder.description.trim(),
        taskDeadline: dueDateTime,
      };

      const response = await tasksAPI.createTask(taskData);

      if (response.data && (response.data.Task || response.data.message)) {
        toast.success('Reminder added successfully!');
        setNewReminder({ title: '', description: '', dueDate: '', dueTime: '' });
        setShowAddModal(false);
        await fetchTasks();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      if (
        apiUtils.handleUnauthorized(error, () => {
          setuser(null);
          localStorage.removeItem('zetta_user');
          toast.error('Session expired. Please login again.');
          onClose();
        })
      )
        return;
      console.error('Error creating task:', error);

      if (error.response?.data?.message) {
        toast.error(`Failed to add reminder: ${error.response.data.message}`);
      } else if (error.response?.status === 400) {
        toast.error('Invalid reminder data. Please check your input.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Failed to add reminder. Please try again.');
      }
    } finally {
      setAddingReminder(false);
    }
  };

  const toggleComplete = async (id) => {
    try {
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
        )
      );

      const response = await tasksAPI.toggleCompletion(id);

      if (response.data && response.data.Task) {
        toast.success('Reminder updated successfully!');
        await fetchTasks();
      }
    } catch (error) {
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder
        )
      );

      if (
        apiUtils.handleUnauthorized(error, () => {
          setuser(null);
          localStorage.removeItem('zetta_user');
          toast.error('Session expired. Please login again.');
          onClose();
        })
      )
        return;
      console.error('Error updating task:', error);
      toast.error('Failed to update reminder');
    }
  };

  const deleteReminder = async (id) => {
    try {
      const response = await tasksAPI.deleteTask(id);

      if (response.data.message) {
        toast.success('Reminder deleted successfully!');
        fetchTasks();
      }
    } catch (error) {
      if (
        apiUtils.handleUnauthorized(error, () => {
          setuser(null);
          localStorage.removeItem('zetta_user');
          toast.error('Session expired. Please login again.');
          onClose();
        })
      )
        return;
      console.error('Error deleting task:', error);
      toast.error('Failed to delete reminder');
    }
  };
  return (
    <>
      {/* Reminders Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-base-100 border-l border-base-300 shadow-2xl z-50 transition-all duration-500 ease-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div
          className={`p-6 border-b border-base-300 bg-base-100 transition-all duration-300 delay-100 ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/10">
                <FiBell className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-base-content">Reminders</h2>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle hover:btn-error transition-colors"
              title="Close Reminders"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div
          className={`p-6 space-y-4 transition-all duration-500 delay-200 ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
          }`}
        >
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary w-full gap-2 hover:scale-105 transition-transform"
          >
            <FiPlus className="w-4 h-4" />
            Add New Reminder
          </button>

          {/* Reminders List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="loading loading-spinner loading-lg text-primary"></div>
                <p className="text-sm text-base-content/60 mt-2">Loading reminders...</p>
              </div>
            ) : reminders.length > 0 ? (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-4 rounded-xl border transition-all hover:shadow-md ${getReminderStyle(
                    reminder
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${getTextColor(reminder)}`}>
                        {reminder.title}
                      </h3>
                      {reminder.description && (
                        <p className={`text-sm mt-1 ${getDescriptionColor(reminder)}`}>
                          {reminder.description}
                        </p>
                      )}
                      <p
                        className={`text-sm mt-2 flex items-center gap-1 ${getTimeColor(reminder)}`}
                      >
                        <FiClock className="w-3 h-3" />
                        {formatDeadline(reminder.dueDate)}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => toggleComplete(reminder.id)}
                        className={`btn btn-ghost btn-sm btn-circle transition-all duration-200 ${
                          reminder.completed
                            ? 'text-success bg-success/20 hover:bg-success/30'
                            : 'text-success hover:bg-success/10 hover:scale-110'
                        }`}
                        title={reminder.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        <FiCheck
                          className={`w-4 h-4 ${reminder.completed ? 'animate-pulse' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10 transition-colors"
                        title="Delete reminder"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiClock className="w-16 h-16 text-base-content/20 mx-auto mb-4" />
                <p className="text-base-content/60">No reminders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md border border-base-300 animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-base-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-base-content">Add New Reminder</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost btn-sm btn-circle hover:btn-error"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Title *</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter reminder title"
                  className="input input-bordered w-full"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  placeholder="Enter description (optional)"
                  className="textarea textarea-bordered w-full h-20 resize-none"
                  value={newReminder.description}
                  onChange={(e) =>
                    setNewReminder((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Due Date</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={newReminder.dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      setNewReminder((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text font-medium">Due Time</span>
                  </label>
                  <input
                    type="time"
                    className="input input-bordered w-full"
                    value={newReminder.dueTime}
                    onChange={(e) =>
                      setNewReminder((prev) => ({ ...prev, dueTime: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-base-300 flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                className="btn btn-primary"
                disabled={!newReminder.title.trim() || addingReminder}
              >
                {addingReminder ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Adding...
                  </>
                ) : (
                  'Add Reminder'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
      )}
    </>
  );
};

Reminder.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Reminder;
