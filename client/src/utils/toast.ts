import { toast, ExternalToast } from 'sonner';

/**
 * Common Toast configuration helper wrapping 'sonner'.
 * Provides unified, typed methods for success, error, info, warning, promise toasts
 * and automated API error response parsing.
 */
export const showToast = {
  success: (message: string, options?: ExternalToast) => {
    return toast.success(message, options);
  },

  error: (message: string, options?: ExternalToast) => {
    return toast.error(message, options);
  },

  info: (message: string, options?: ExternalToast) => {
    return toast.info(message, options);
  },

  warning: (message: string, options?: ExternalToast) => {
    return toast.warning(message, options);
  },

  promise: <T>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    },
    options?: ExternalToast
  ) => {
    return toast.promise(promise, {
      ...msgs,
      ...options,
    });
  },

  dismiss: (id?: string | number) => {
    toast.dismiss(id);
  },

  /**
   * Helper to automatically extract error message from API responses or Error objects
   */
  apiError: (error: any, fallbackMessage: string = 'An unexpected error occurred', options?: ExternalToast) => {
    let message = fallbackMessage;

    if (error?.response?.data?.error) {
      message = typeof error.response.data.error === 'string'
        ? error.response.data.error
        : JSON.stringify(error.response.data.error);
    } else if (error?.response?.data?.message) {
      message = typeof error.response.data.message === 'string'
        ? error.response.data.message
        : JSON.stringify(error.response.data.message);
    } else if (error?.message) {
      message = error.message;
    }

    return toast.error(message, options);
  },
};

export default showToast;
