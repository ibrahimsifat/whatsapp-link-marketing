import { toast } from "sonner"

export class ToastUtils {
  /**
   * Shows success toast
   */
  static success(message: string): void {
    toast.success(message)
  }

  /**
   * Shows error toast
   */
  static error(message: string): void {
    toast.error(message)
  }

  /**
   * Shows info toast
   */
  static info(message: string): void {
    toast.info(message)
  }

  /**
   * Shows warning toast
   */
  static warning(message: string): void {
    toast.warning(message)
  }

  /**
   * Shows loading toast
   */
  static loading(message: string): string | number {
    return toast.loading(message)
  }

  /**
   * Dismisses a specific toast
   */
  static dismiss(toastId: string | number): void {
    toast.dismiss(toastId)
  }

  /**
   * Dismisses all toasts
   */
  static dismissAll(): void {
    toast.dismiss()
  }

  /**
   * Shows a promise toast. Returns the settled value once the promise resolves.
   */
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
  ): Promise<T> {
    toast.promise(promise, messages)
    return promise
  }
}
