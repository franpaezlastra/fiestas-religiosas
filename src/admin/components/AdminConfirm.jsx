import { useCallback, useState } from "react";
import { AdminButton } from "./AdminButton";

/**
 * Diálogo de confirmación reutilizable (nunca window.confirm / alert).
 * Overlay propio para no circular-importar AdminModal.
 */
export function AdminConfirmDialog({
  open,
  title = "Confirmar",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "danger-solid",
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Cancelar"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--shadow-modal)]"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <header className="border-b border-[var(--admin-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">{title}</h2>
        </header>
        <div className="px-5 py-4">
          <p className="text-sm text-[var(--admin-text)]">{message}</p>
        </div>
        <footer className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-border)] px-5 py-4">
          <AdminButton variante={confirmVariant} onClick={onConfirm} disabled={busy}>
            {busy ? "…" : confirmLabel}
          </AdminButton>
          <AdminButton variante="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </AdminButton>
        </footer>
      </div>
    </div>
  );
}

export function useAdminConfirm() {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Confirmar",
    cancelLabel: "Cancelar",
    confirmVariant: "danger-solid",
    resolve: null,
  });

  const ask = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: opts.title || "Confirmar",
        message: opts.message || "¿Continuar?",
        confirmLabel: opts.confirmLabel || "Confirmar",
        cancelLabel: opts.cancelLabel || "Cancelar",
        confirmVariant: opts.confirmVariant || "danger-solid",
        resolve,
      });
    });
  }, []);

  const onConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state.resolve]);

  const onCancel = useCallback(() => {
    state.resolve?.(false);
    setState((s) => ({ ...s, open: false, resolve: null }));
  }, [state.resolve]);

  const dialog = (
    <AdminConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      confirmVariant={state.confirmVariant}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );

  return { ask, dialog };
}
