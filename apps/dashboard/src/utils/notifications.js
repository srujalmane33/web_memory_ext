import { toast } from 'sonner';

/**
 * Unified notification service wrapping sonner
 */
export const notify = {
  success(message, description) {
    return toast.success(message, {
      description,
      duration: 3500,
    });
  },

  error(message, description) {
    return toast.error(message, {
      description,
      duration: 4500,
    });
  },

  info(message, description) {
    return toast.info(message, {
      description,
      duration: 3000,
    });
  },

  warning(message, description) {
    return toast.warning(message, {
      description,
      duration: 4000,
    });
  },

  /**
   * Shows an interactive in-toast confirmation banner
   * @param {string} title 
   * @param {object} options 
   * @param {string} options.description 
   * @param {string} options.confirmText 
   * @param {string} options.cancelText 
   * @param {Function} options.onConfirm 
   * @param {Function} [options.onCancel] 
   */
  confirm(title, { description, confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel } = {}) {
    return toast(title, {
      description,
      duration: 8000,
      action: {
        label: confirmText,
        onClick: () => {
          if (onConfirm) onConfirm();
        },
      },
      cancel: {
        label: cancelText,
        onClick: () => {
          if (onCancel) onCancel();
        },
      },
    });
  },

  promise(promise, messages) {
    return toast.promise(promise, messages);
  },

  dismiss(toastId) {
    toast.dismiss(toastId);
  },
};
