import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];

function dispatch(toast: Toast) {
  toasts = [...toasts, toast];
  listeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== toast.id);
    listeners.forEach((l) => l(toasts));
  }, 3500);
}

export function toast(opts: Omit<Toast, "id">) {
  dispatch({ ...opts, id: Math.random().toString(36).slice(2) });
}

export function useToast() {
  const [ts, setTs] = useState<Toast[]>(toasts);

  const subscribe = useCallback(() => {
    const handler = (next: Toast[]) => setTs([...next]);
    listeners.push(handler);
    return () => { listeners = listeners.filter((l) => l !== handler); };
  }, []);

  useState(subscribe);

  return {
    toasts: ts,
    toast: (opts: Omit<Toast, "id">) => toast(opts),
    dismiss: (id: string) => {
      toasts = toasts.filter((t) => t.id !== id);
      listeners.forEach((l) => l(toasts));
    },
  };
}
