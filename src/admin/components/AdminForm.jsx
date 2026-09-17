const inputClass =
  "admin-input mt-1.5 w-full border border-azul-logo/25 bg-blanco px-3.5 py-2.5 text-sm text-texto transition-[border-color,box-shadow] placeholder:text-texto/40 focus:border-celeste-cielo focus:shadow-[0_0_0_3px_rgb(0_152_212/0.15)] focus:outline-none";

export function AdminPageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-azul-petroleo">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-texto/80">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminSection({ title, description, children }) {
  return (
    <section className="border-b border-azul-logo/10 py-5 last:border-b-0 last:pb-0">
      <div className="mb-4">
        <h3 className="font-display text-base text-azul-petroleo">{title}</h3>
        {description ? <p className="mt-1 text-xs leading-relaxed text-texto/70">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function AdminField({
  label,
  hint,
  required,
  className = "",
  children,
  span = 1,
}) {
  return (
    <label className={`${span === 2 ? "sm:col-span-2" : ""} ${className}`}>
      <span className="text-xs font-medium tracking-wide text-azul-petroleo">
        {label}
        {required ? <span className="text-naranja-libro"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-snug text-texto/60">{hint}</span> : null}
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
    <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-azul-logo/15 bg-papel/60 px-3 py-3 transition hover:border-celeste-cielo/50">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 accent-celeste-cielo"
      />
      <span>
        <span className="block text-sm font-medium text-azul-petroleo">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] text-texto/65">{hint}</span> : null}
      </span>
    </label>
  );
}

export function AdminAlert({ type = "info", children }) {
  const styles =
    type === "error"
      ? "border-naranja-libro/40 bg-naranja-libro/10 text-naranja-libro"
      : type === "success"
        ? "border-celeste-cielo/40 bg-celeste-cielo/10 text-azul-petroleo"
        : "border-azul-logo/20 bg-papel text-texto";
  return <div className={`border px-3 py-2.5 text-sm ${styles}`}>{children}</div>;
}

export function AdminBadge({ status }) {
  const map = {
    DRAFT: "bg-papel text-texto border-azul-logo/20",
    PUBLISHED: "bg-celeste-cielo/15 text-azul-petroleo border-celeste-cielo/30",
    ARCHIVED: "bg-texto/10 text-texto/70 border-texto/20",
  };
  const labels = { DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado" };
  return (
    <span
      className={`inline-flex border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${map[status] || map.DRAFT}`}
    >
      {labels[status] || status}
    </span>
  );
}

export function AdminPanel({ title, children, footer }) {
  return (
    <div className="border border-azul-logo/15 bg-blanco shadow-[0_10px_30px_rgb(3_62_96/0.06)]">
      {title ? (
        <div className="border-b border-azul-logo/10 bg-papel/50 px-5 py-3">
          <h2 className="font-display text-lg text-azul-petroleo">{title}</h2>
        </div>
      ) : null}
      <div className="px-5 py-2">{children}</div>
      {footer ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-azul-logo/10 bg-papel/40 px-5 py-4">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function AdminTable({ columns, rows, empty }) {
  if (!rows.length) {
    return (
      <div className="border border-dashed border-azul-logo/25 bg-blanco px-6 py-12 text-center text-sm text-texto/70">
        {empty || "No hay registros todavía."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-azul-logo/15 bg-blanco shadow-[0_10px_30px_rgb(3_62_96/0.04)]">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-azul-petroleo text-blanco">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-xs font-medium uppercase tracking-wide">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-azul-logo/10 transition hover:bg-papel/70"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 align-middle">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
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
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto/40">
        ⌕
      </span>
    </div>
  );
}
