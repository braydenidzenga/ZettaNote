import toast from 'react-hot-toast';

// Custom toast utility with consistent styling and icons
export const showToast = {
  success: (message) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)',
      },
      iconTheme: {
        primary: 'white',
        secondary: '#10B981',
      },
    });
  },

  error: (message) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)',
      },
      iconTheme: {
        primary: 'white',
        secondary: '#EF4444',
      },
    });
  },

  info: (message) => {
    toast(message, {
      duration: 3000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2)',
      },
    });
  },

  loading: (message) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6B7280',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(107, 114, 128, 0.2)',
      },
    });
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong!',
      },
      {
        position: 'top-right',
        style: {
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '12px 16px',
        },
        success: {
          style: {
            background: '#10B981',
            color: 'white',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)',
          },
        },
        error: {
          style: {
            background: '#EF4444',
            color: 'white',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)',
          },
        },
      }
    );
  },
};
