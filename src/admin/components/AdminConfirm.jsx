import { useCallback, useState } from "react";
import { AdminButton } from "./AdminButton";
import { AdminModal } from "./AdminModal";

/**
 * Confirmación destructiva reutilizable (no window.confirm).
 */
export function AdminConfirmDialog({
  open,
  title = "Confirmar",
  message,
  confirmLabel = "Archivar",
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!open) return null;
  return (
    <AdminModal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <AdminButton variante="danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? "…" : confirmLabel}
          </AdminButton>
          <AdminButton variante="secondary" onClick={onCancel} disabled={busy}>
            Cancelar
          </AdminButton>
        </>
      }
    >
      <p className="text-sm text-[var(--admin-text)]">{message}</p>
    </AdminModal>
  );
}

export function useAdminConfirm() {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Archivar",
    resolve: null,
  });

  const ask = useCallback((opts) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: opts.title || "Confirmar",
        message: opts.message || "¿Continuar?",
        confirmLabel: opts.confirmLabel || "Archivar",
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
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );

  return { ask, dialog };
}
