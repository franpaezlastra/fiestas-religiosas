import { useEffect, useRef } from "react";
import { AdminButton } from "./AdminButton";
import { useAdminConfirm } from "./AdminConfirm";

/**
 * Modal admin: focus trap básico, Escape, footer sticky, overlay blur.
 * Si dirty=true, pide confirmación con AdminConfirm (nunca window.confirm).
 */
export function AdminModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "lg",
  dirty = false,
  layer = "default",
}) {
  const panelRef = useRef(null);
  const firstFocusRef = useRef(null);
  const confirm = useAdminConfirm();

  async function requestClose() {
    if (dirty) {
      const ok = await confirm.ask({
        title: "Cambios sin guardar",
        message: "Hay cambios sin guardar. ¿Cerrar igual?",
        confirmLabel: "Cerrar igual",
        confirmVariant: "primary",
      });
      if (!ok) return;
    }
    onClose?.();
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelector(
        "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href]",
      );
      (firstFocusRef.current || focusable)?.focus?.();
    }, 30);

    function onKey(e) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      requestClose();
    }

    function onTab(e) {
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = [
        ...panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onTab);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", onTab);
    };
    // requestClose depends on dirty/onClose; re-bind when those change
  }, [open, onClose, dirty]);

  if (!open) return null;

  const width =
    size === "sm"
      ? "max-w-lg"
      : size === "md"
        ? "max-w-2xl"
        : size === "xl"
          ? "max-w-5xl"
          : "max-w-3xl";

  const zClass = layer === "confirm" ? "z-[100]" : "z-[80]";

  return (
    <>
      {confirm.dialog}
      <div className={`fixed inset-0 ${zClass} flex items-end justify-center sm:items-center sm:p-4`}>
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          aria-label="Cerrar"
          onClick={requestClose}
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`relative flex max-h-[92vh] w-full flex-col border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--shadow-modal)] ${width}`}
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--admin-border)] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-text)]">{title}</h2>
              {subtitle ? (
                <p className="mt-1 text-sm text-[var(--admin-text-muted)]">{subtitle}</p>
              ) : null}
            </div>
            <AdminButton variante="ghost" tamano="icon" onClick={requestClose} aria-label="Cerrar">
              ×
            </AdminButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer ? (
            <footer className="sticky bottom-0 flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function AdminModalActions({
  onCancel,
  saving,
  submitLabel,
  cancelLabel = "Cancelar",
  formId,
  dirty = false,
}) {
  const confirm = useAdminConfirm();

  async function handleCancel() {
    if (dirty) {
      const ok = await confirm.ask({
        title: "Cambios sin guardar",
        message: "Hay cambios sin guardar. ¿Cerrar igual?",
        confirmLabel: "Cerrar igual",
        confirmVariant: "primary",
      });
      if (!ok) return;
    }
    onCancel?.();
  }

  return (
    <>
      {confirm.dialog}
      <AdminButton type="submit" form={formId} disabled={saving}>
        {saving ? "Guardando…" : submitLabel}
      </AdminButton>
      <AdminButton variante="secondary" onClick={handleCancel} disabled={saving}>
        {cancelLabel}
      </AdminButton>
    </>
  );
}
