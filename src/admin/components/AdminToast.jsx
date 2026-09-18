import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AdminButton } from "./AdminButton";

const ToastCtx = createContext(null);

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item = {
        id,
        type: toast.type || "info",
        message: toast.message,
        undo: toast.undo || null,
      };
      setToasts((list) => [...list, item]);
      window.setTimeout(() => dismiss(id), toast.undo ? 8000 : 4000);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 border px-3 py-3 text-sm shadow-[var(--shadow-card)] ${
              t.type === "error"
                ? "border-[color-mix(in_srgb,var(--admin-danger)_40%,transparent)] bg-white text-[var(--admin-danger)]"
                : t.type === "success"
                  ? "border-[color-mix(in_srgb,var(--admin-success)_40%,transparent)] bg-white text-[var(--admin-text)]"
                  : "border-[var(--admin-border)] bg-white text-[var(--admin-text)]"
            }`}
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <p className="min-w-0 flex-1">{t.message}</p>
            {t.undo ? (
              <AdminButton
                variante="secondary"
                tamano="sm"
                onClick={async () => {
                  await t.undo();
                  dismiss(t.id);
                }}
              >
                Deshacer
              </AdminButton>
            ) : null}
            <button
              type="button"
              className="text-[var(--admin-text-muted)]"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    return {
      push: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}
