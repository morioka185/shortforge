import { useEffect, useState } from "react";

export interface ToastMessage {
  id: string;
  type: "info" | "success" | "warning" | "error";
  message: string;
}

const typeStyles: Record<string, string> = {
  info: "bg-blue-900/90 border-blue-600 text-blue-200",
  success: "bg-green-900/90 border-green-600 text-green-200",
  warning: "bg-yellow-900/90 border-yellow-600 text-yellow-200",
  error: "bg-red-900/90 border-red-600 text-red-200",
};

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let toasts: ToastMessage[] = [];

function notify() {
  toastListeners.forEach((fn) => fn([...toasts]));
}

export function showToast(
  type: ToastMessage["type"],
  message: string,
  durationMs = 4000,
) {
  const id = `${Date.now()}-${Math.random()}`;
  toasts = [...toasts, { id, type, message }];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, durationMs);
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListeners.push(setItems);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {items.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg border shadow-lg text-sm animate-in slide-in-from-right ${typeStyles[toast.type]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
