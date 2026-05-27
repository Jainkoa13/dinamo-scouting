import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`rounded-lg border px-4 py-3 shadow-lg cursor-pointer transition-all ${
            t.variant === "destructive"
              ? "bg-destructive text-destructive-foreground border-destructive"
              : "bg-card text-card-foreground border-border"
          }`}
        >
          <div className="font-semibold text-sm">{t.title}</div>
          {t.description && <div className="text-xs mt-0.5 opacity-80">{t.description}</div>}
        </div>
      ))}
    </div>
  );
}
