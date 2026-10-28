export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration: number;
}

class ToastStore {
  toasts = $state<ToastItem[]>([]);

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const item: ToastItem = { id, type, message, duration };
    this.toasts = [...this.toasts, item];

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, options?: { duration?: number }) {
    this.show(message, 'success', options?.duration ?? 3000);
  }

  error(message: string, options?: { duration?: number }) {
    this.show(message, 'error', options?.duration ?? 4000);
  }

  info(message: string, options?: { duration?: number }) {
    this.show(message, 'info', options?.duration ?? 3000);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}

export const toast = new ToastStore();

