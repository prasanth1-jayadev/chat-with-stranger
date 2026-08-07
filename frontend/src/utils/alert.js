// Event emitter based notification & sweet alert system
// Works seamlessly both inside and outside React components

let listeners = [];
let toasts = [];
let currentModal = null;

const notifyListeners = () => {
  listeners.forEach((listener) => listener({ toasts: [...toasts], currentModal }));
};

export const subscribeAlerts = (listener) => {
  listeners.push(listener);
  listener({ toasts: [...toasts], currentModal });
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

// ==========================================
// TOAST NOTIFICATIONS (Lightweight, auto-dismiss)
// ==========================================
export const toast = {
  show: (message, type = 'info', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration, createdAt: Date.now() };
    toasts = [...toasts, newToast];
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  success: (message, duration = 3500) => toast.show(message, 'success', duration),
  error: (message, duration = 4000) => toast.show(message, 'error', duration),
  warning: (message, duration = 4000) => toast.show(message, 'warning', duration),
  info: (message, duration = 3500) => toast.show(message, 'info', duration),
  dismiss: (id) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  }
};

// ==========================================
// SWEET ALERTS & CONFIRM MODALS (Promise-based)
// ==========================================
export const sweetAlert = {
  fire: ({
    title = '',
    message = '',
    icon = 'info', // 'success' | 'error' | 'warning' | 'info' | 'question'
    confirmText = 'OK',
    cancelText = null,
    isDanger = false
  } = {}) => {
    return new Promise((resolve) => {
      currentModal = {
        title,
        message,
        icon,
        confirmText,
        cancelText,
        isDanger,
        onConfirm: () => {
          currentModal = null;
          notifyListeners();
          resolve(true);
        },
        onCancel: () => {
          currentModal = null;
          notifyListeners();
          resolve(false);
        }
      };
      notifyListeners();
    });
  },

  success: (title, message = '') => {
    return sweetAlert.fire({ title, message, icon: 'success', confirmText: 'Great!' });
  },

  error: (title, message = '') => {
    return sweetAlert.fire({ title, message, icon: 'error', confirmText: 'Understood', isDanger: true });
  },

  warning: (title, message = '') => {
    return sweetAlert.fire({ title, message, icon: 'warning', confirmText: 'Got it' });
  },

  info: (title, message = '') => {
    return sweetAlert.fire({ title, message, icon: 'info', confirmText: 'OK' });
  },

  confirm: ({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    icon = 'warning'
  } = {}) => {
    return sweetAlert.fire({
      title,
      message,
      icon,
      confirmText,
      cancelText,
      isDanger
    });
  }
};

export default { toast, sweetAlert };
