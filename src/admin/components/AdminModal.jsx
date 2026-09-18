import { useEffect, useRef } from "react";
import { AdminButton } from "./AdminButton";

/**
 * Modal admin: focus trap básico, Escape, footer sticky, overlay blur.
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
}) {
  const panelRef = useRef(null);
  const firstFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelector(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href]',
      );
      (firstFocusRef.current || focusable)?.focus?.();
    }, 30);

    function onKey(e) {
      if (e.key !== "Escape") return;
      if (dirty) {
        const ok = window.confirm("Hay cambios sin guardar. ¿Cerrar igual?");
        if (!ok) return;
      }
      onClose?.();
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

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={() => {
          if (dirty) {
            const ok = window.confirm("Hay cambios sin guardar. ¿Cerrar igual?");
            if (!ok) return;
          }
          onClose?.();
        }}
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
          <AdminButton
            variante="ghost"
            tamano="icon"
            onClick={() => {
              if (dirty) {
                const ok = window.confirm("Hay cambios sin guardar. ¿Cerrar igual?");
                if (!ok) return;
              }
              onClose?.();
            }}
            aria-label="Cerrar"
          >
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
  );
}

export function AdminModalActions({
  onCancel,
  saving,
  submitLabel,
  cancelLabel = "Cancelar",
  formId,
}) {
  return (
    <>
      <AdminButton type="submit" form={formId} disabled={saving}>
        {saving ? "Guardando…" : submitLabel}
      </AdminButton>
      <AdminButton variante="secondary" onClick={onCancel} disabled={saving}>
        {cancelLabel}
      </AdminButton>
    </>
  );
}
