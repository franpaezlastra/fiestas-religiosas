import { useState } from "react";

/**
 * Lista ordenable HTML5 (mismo patrón que De La Vega Automotores / Vehiculos).
 * Sin librería: drag nativo, onReorder(ids) al soltar.
 */
export function AdminSortableList({
  items,
  getId = (item) => item.id,
  onReorder,
  renderItem,
  busy = false,
  empty = "No hay ítems para ordenar.",
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  if (!items?.length) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]">{empty}</p>
    );
  }

  function handleDragStart(e, index) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    e.currentTarget.classList.add("opacity-50");
  }

  function handleDragEnd(e) {
    e.currentTarget.classList.remove("opacity-50");
    setDragIndex(null);
    setDropIndex(null);
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  }

  function handleDragLeave() {
    setDropIndex(null);
  }

  async function handleDrop(e, dropIdx) {
    e.preventDefault();
    const dragIdx = dragIndex ?? parseInt(e.dataTransfer.getData("text/plain"), 10);
    setDragIndex(null);
    setDropIndex(null);
    if (Number.isNaN(dragIdx) || dragIdx === dropIdx) return;

    const list = [...items];
    const [removed] = list.splice(dragIdx, 1);
    list.splice(dropIdx, 0, removed);
    await onReorder(list.map(getId), list);
  }

  return (
    <ul className="divide-y divide-[var(--admin-border)] overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)" }}
    >
      {items.map((item, index) => {
        const id = getId(item);
        const isDrop = dropIndex === index;
        return (
          <li
            key={id}
            draggable={!busy}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
              busy ? "cursor-wait opacity-70" : "cursor-grab active:cursor-grabbing"
            } ${isDrop ? "bg-[color-mix(in_srgb,var(--admin-accent)_8%,transparent)] ring-2 ring-inset ring-[var(--admin-accent)]" : "hover:bg-[var(--admin-bg)]"}`}
          >
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-semibold text-[var(--admin-text-muted)]"
              style={{
                background: "var(--admin-bg)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {index + 1}
            </span>
            <span
              className="flex-shrink-0 text-[var(--admin-text-muted)] select-none"
              aria-hidden
              title="Arrastrar"
            >
              ☰
            </span>
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </li>
        );
      })}
    </ul>
  );
}

/** next displayOrder = max(existing) + 1 (o 0 si vacío) */
export function nextDisplayOrder(items, field = "displayOrder") {
  if (!items?.length) return 0;
  let max = -1;
  for (const item of items) {
    const n = Number(item?.[field]);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return max + 1;
}
