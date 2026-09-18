const inputClass = "admin-input";

export function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--admin-text)]">{title}</h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-[var(--admin-text-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminStatCard({ label, value, hint }) {
  return (
    <div
      className="border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4"
      style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-[11px] font-semibold tracking-wide text-[var(--admin-text-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold text-[var(--admin-accent)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--admin-text-muted)]">{hint}</p> : null}
    </div>
  );
}

export function AdminPagination({ page, totalPages, from, to, total, onPageChange }) {
  if (total === 0) return null;
  return (
    <div
      className="mt-0 flex flex-wrap items-center justify-between gap-3 border border-t-0 border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm"
      style={{ borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}
    >
      <p className="text-[var(--admin-text-muted)]">
        Mostrando{" "}
        <span className="font-medium text-[var(--admin-text)]">
          {from}–{to}
        </span>{" "}
        de <span className="font-medium text-[var(--admin-text)]">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="admin-btn admin-btn--secondary admin-btn--sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="min-w-[4.5rem] text-center text-xs text-[var(--admin-text-muted)]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="admin-btn admin-btn--secondary admin-btn--sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export function AdminSection({ title, description, children }) {
  return (
    <section className="border-b border-[var(--admin-border)] py-5 last:border-b-0 last:pb-0">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-[var(--admin-text-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function AdminField({ label, hint, required, className = "", children, span = 1 }) {
  return (
    <label className={`${span === 2 ? "sm:col-span-2" : ""} ${className}`}>
      <span className="text-xs font-medium text-[var(--admin-text)]">
        {label}
        {required ? <span className="text-[var(--admin-danger)]"> *</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[11px] leading-snug text-[var(--admin-text-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function AdminInput({ className = "", ...props }) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function AdminTextarea({ className = "", rows = 4, ...props }) {
  return <textarea rows={rows} className={`${inputClass} resize-y ${className}`} {...props} />;
}

export function AdminSelect({ className = "", children, ...props }) {
  return (
    <select className={`${inputClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function AdminCheckbox({ label, hint, checked, onChange, name }) {
  return (
    <label
      className="flex cursor-pointer items-start gap-3 border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-3 transition hover:border-[var(--admin-accent)]"
      style={{ borderRadius: "var(--radius-sm)" }}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-[var(--admin-accent)]"
      />
      <span>
        <span className="block text-sm font-medium text-[var(--admin-text)]">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[11px] text-[var(--admin-text-muted)]">{hint}</span>
        ) : null}
      </span>
    </label>
  );
}

export function AdminAlert({ type = "info", children }) {
  const styles =
    type === "error"
      ? "border-[color-mix(in_srgb,var(--admin-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--admin-danger)_8%,white)] text-[var(--admin-danger)]"
      : type === "success"
        ? "border-[color-mix(in_srgb,var(--admin-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--admin-success)_8%,white)] text-[var(--admin-success)]"
        : "border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--admin-text)]";
  return (
    <div className={`border px-3 py-2.5 text-sm ${styles}`} style={{ borderRadius: "var(--radius-sm)" }}>
      {children}
    </div>
  );
}

export function AdminBadge({ status }) {
  const cls =
    status === "PUBLISHED"
      ? "admin-badge admin-badge--published"
      : status === "ARCHIVED"
        ? "admin-badge admin-badge--archived"
        : "admin-badge admin-badge--draft";
  const labels = { DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado" };
  return <span className={cls}>{labels[status] || status}</span>;
}

export function AdminPanel({ title, children, footer }) {
  return (
    <div
      className="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}
    >
      {title ? (
        <div className="border-b border-[var(--admin-border)] px-5 py-3">
          <h2 className="text-base font-semibold text-[var(--admin-text)]">{title}</h2>
        </div>
      ) : null}
      <div className="px-5 py-2">{children}</div>
      {footer ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-border)] px-5 py-4">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AdminTable({ columns, rows, empty, emptyAction }) {
  if (!rows.length) {
    return (
      <div
        className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-14 text-center"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <p className="text-sm text-[var(--admin-text-muted)]">
          {empty || "No hay registros todavía."}
        </p>
        {emptyAction ? <div className="mt-4 flex justify-center">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminSearch({ value, onChange, placeholder = "Buscar…" }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} !mt-0 pl-9`}
      />
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--admin-text-muted)]">
        ⌕
      </span>
    </div>
  );
}

export function AdminToolbar({ search, children }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 sm:max-w-md">{search}</div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function AdminIconButton({ label, onClick, children, danger = false }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`admin-btn admin-btn--icon admin-btn--ghost ${danger ? "text-[var(--admin-danger)]" : ""}`}
    >
      {children}
    </button>
  );
}
