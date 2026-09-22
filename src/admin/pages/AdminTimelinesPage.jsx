import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  archiveTimeline,
  createTimeline,
  fetchAdminTimelines,
  updateTimeline,
} from "../../redux/slices/timelinesSlice";
import { fetchAdminMedia } from "../../redux/slices/mediaSlice";
import { timelinesService } from "../../services";
import { slugify } from "../../utils/slugify";
import { useAdminPagination } from "../hooks/useAdminPagination";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
import { AdminSortableList, nextDisplayOrder } from "../components/AdminSortableList";
import { mediaUrl } from "../utils/mediaUrl";
import {
  AdminAlert,
  AdminBadge,
  AdminField,
  AdminIconButton,
  AdminInput,
  AdminPageHeader,
  AdminPagination,
  AdminSearch,
  AdminSection,
  AdminSelect,
  AdminStatCard,
  AdminTable,
  AdminTextarea,
  AdminToolbar,
} from "../components/AdminForm";

const emptyForm = {
  code: "",
  title: "",
  slug: "",
  description: "",
  displayOrder: "0",
  status: "DRAFT",
};

function emptyEvent(order = 0) {
  return {
    _key: `new-${Date.now()}-${order}`,
    startDate: "",
    endDate: "",
    displayOrder: String(order),
    status: "PUBLISHED",
    title: "",
    dateDescription: "",
    description: "",
    images: [],
    pickMediaId: "",
    open: true,
  };
}

function titleOf(item) {
  return item.translations?.find((t) => t.locale === "es")?.title || item.code;
}

function normalizeCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function mapApiEvent(ev, index) {
  const tr =
    ev.translation ||
    ev.translations?.find((t) => t.locale === "es") ||
    ev.translations?.[0];
  return {
    _key: ev.id || `evt-${index}`,
    id: ev.id,
    startDate: ev.startDate ? String(ev.startDate).slice(0, 10) : "",
    endDate: ev.endDate ? String(ev.endDate).slice(0, 10) : "",
    displayOrder: String(ev.displayOrder ?? index),
    status: ev.status || "PUBLISHED",
    title: tr?.title || "",
    dateDescription: tr?.dateDescription || "",
    description: tr?.description || "",
    images: Array.isArray(ev.images) ? ev.images : [],
    pickMediaId: "",
    open: false,
  };
}

function serializeEventImages(images) {
  return (images || [])
    .map((img, i) => {
      const mediaId = img.mediaId || img.media?.id;
      if (!mediaId) return null;
      return {
        mediaId,
        isPrimary: Boolean(img.isPrimary) || i === 0,
        displayOrder: img.displayOrder ?? i,
        translations: img.translations?.length
          ? img.translations.map((t) => ({
              locale: t.locale || "es",
              caption: t.caption ?? null,
              altText: t.altText ?? null,
            }))
          : [{ locale: "es", caption: null, altText: null }],
      };
    })
    .filter(Boolean);
}

function eventsToPayload(events) {
  return events.map((ev, index) => ({
    startDate: ev.startDate || null,
    endDate: ev.endDate || null,
    displayOrder: Number(ev.displayOrder) || index,
    status: ev.status || "PUBLISHED",
    translations: [
      {
        locale: "es",
        title: ev.title.trim(),
        description: ev.description.trim() || null,
        dateDescription: ev.dateDescription.trim() || String(ev.startDate || index + 1),
      },
    ],
    images: serializeEventImages(ev.images),
  }));
}

export function AdminTimelinesPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.timelines.adminItems);
  const media = useSelector((state) => state.media.items);
  const toast = useAdminToast();
  const confirm = useAdminConfirm();
  const [form, setForm] = useState(emptyForm);
  const [events, setEvents] = useState([]);
  const [eventsDirty, setEventsDirty] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [modoOrdenar, setModoOrdenar] = useState(false);
  const [reorderBusy, setReorderBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminTimelines());
    dispatch(fetchAdminMedia());
  }, [dispatch]);

  const statusFiltered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const filterFn = useCallback((list, q) => {
    if (!q) return list;
    return list.filter((item) =>
      `${titleOf(item)} ${item.code} ${item.status}`.toLowerCase().includes(q),
    );
  }, []);

  const pager = useAdminPagination(statusFiltered, { filterFn });

  const sortableItems = useMemo(
    () =>
      [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999)),
    [items],
  );

  async function onReorderTimelines(ids) {
    setReorderBusy(true);
    try {
      await timelinesService.reorder(ids);
      toast.push({ type: "success", message: "Orden de cronologías actualizado." });
      dispatch(fetchAdminTimelines());
    } catch (err) {
      toast.push({
        type: "error",
        message: err.message || "No se pudo reordenar",
      });
    } finally {
      setReorderBusy(false);
    }
  }

  async function onArchive(row) {
    const ok = await confirm.ask({
      title: "Archivar cronología",
      message: `¿Archivar «${titleOf(row)}»? Dejará de aparecer en el sitio público.`,
      confirmLabel: "Archivar",
    });
    if (!ok) return;
    const previousStatus = row.status || "DRAFT";
    const action = await dispatch(archiveTimeline(row.id));
    if (action.meta.requestStatus === "rejected") {
      toast.push({
        type: "error",
        message: action.payload?.message || "No se pudo archivar",
      });
      return;
    }
    if (editingId === row.id) closeModal();
    toast.push({
      type: "success",
      message: "Cronología archivada.",
      undo: async () => {
        await dispatch(
          updateTimeline({ id: row.id, body: { status: previousStatus } }),
        );
        dispatch(fetchAdminTimelines());
      },
    });
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      displayOrder: String(nextDisplayOrder(items)),
    });
    setEvents([]);
    setEventsDirty(false);
    setError("");
    setModalOpen(true);
  }

  async function openEdit(item) {
    setError("");
    setLoadingDetail(true);
    setModalOpen(true);
    setEditingId(item.id);
    try {
      const detail = await timelinesService.adminGet(item.id);
      const tr =
        detail.translations?.find((t) => t.locale === "es") || detail.translations?.[0];
      setForm({
        code: detail.code || "",
        title: tr?.title || "",
        slug: tr?.slug || "",
        description: tr?.description || "",
        displayOrder: String(detail.displayOrder ?? 0),
        status: detail.status || "DRAFT",
      });
      const sorted = [...(detail.events || [])].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      );
      setEvents(sorted.map(mapApiEvent));
      setEventsDirty(false);
    } catch (err) {
      setError(err.message || "No se pudo cargar la cronología");
      const tr = item.translations?.find((t) => t.locale === "es") || item.translations?.[0];
      setForm({
        code: item.code || "",
        title: tr?.title || "",
        slug: tr?.slug || "",
        description: tr?.description || "",
        displayOrder: String(item.displayOrder ?? 0),
        status: item.status || "DRAFT",
      });
      setEvents((item.events || []).map(mapApiEvent));
      setEventsDirty(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setEvents([]);
    setEventsDirty(false);
  }

  function updateEvent(key, patch) {
    setEventsDirty(true);
    setEvents((list) => list.map((ev) => (ev._key === key ? { ...ev, ...patch } : ev)));
  }

  function removeEvent(key) {
    setEventsDirty(true);
    setEvents((list) => list.filter((ev) => ev._key !== key));
  }

  function addEvent() {
    setEventsDirty(true);
    setEvents((list) => [...list, emptyEvent(nextDisplayOrder(list))]);
  }

  function onReorderEvents(_ids, reordered) {
    setEventsDirty(true);
    setEvents(
      reordered.map((ev, index) => ({
        ...ev,
        displayOrder: String(index),
      })),
    );
  }

  function addImageToEvent(eventKey) {
    setEvents((list) =>
      list.map((ev) => {
        if (ev._key !== eventKey || !ev.pickMediaId) return ev;
        const mediaId = ev.pickMediaId;
        const already = (ev.images || []).some(
          (img) => (img.mediaId || img.media?.id) === mediaId,
        );
        if (already) return { ...ev, pickMediaId: "" };
        const mediaItem = media.find((m) => m.id === mediaId);
        return {
          ...ev,
          pickMediaId: "",
          images: [
            ...(ev.images || []),
            {
              mediaId,
              isPrimary: (ev.images || []).length === 0,
              displayOrder: (ev.images || []).length,
              media: mediaItem,
              translations: [
                { locale: "es", caption: null, altText: ev.title || null },
              ],
            },
          ],
        };
      }),
    );
    setEventsDirty(true);
  }

  function removeImageFromEvent(eventKey, mediaId) {
    setEventsDirty(true);
    setEvents((list) =>
      list.map((ev) => {
        if (ev._key !== eventKey) return ev;
        const next = (ev.images || [])
          .filter((img) => (img.mediaId || img.media?.id) !== mediaId)
          .map((img, index) => ({
            ...img,
            isPrimary: index === 0,
            displayOrder: index,
          }));
        return { ...ev, images: next };
      }),
    );
  }

  function setPrimaryEventImage(eventKey, mediaId) {
    setEventsDirty(true);
    setEvents((list) =>
      list.map((ev) => {
        if (ev._key !== eventKey) return ev;
        return {
          ...ev,
          images: (ev.images || []).map((img) => ({
            ...img,
            isPrimary: (img.mediaId || img.media?.id) === mediaId,
          })),
        };
      }),
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const code = normalizeCode(form.code);
    if (!code) {
      setError("El código es obligatorio (A-Z, 0-9, _).");
      setSaving(false);
      return;
    }

    if (eventsDirty || !editingId) {
      const bad = events.find((ev) => !ev.title.trim() || !ev.dateDescription.trim());
      if (events.length && bad) {
        setError("Cada hito necesita título y descripción de fecha.");
        setSaving(false);
        return;
      }
    }

    const body = {
      code,
      displayOrder: Number(form.displayOrder) || 0,
      status: form.status,
      translations: [
        {
          locale: "es",
          title: form.title,
          slug: form.slug || slugify(form.title),
          description: form.description || null,
        },
      ],
    };

    // Create: incluir events (puede ser []). Update: solo si el editor de hitos cambió.
    if (!editingId) {
      body.events = eventsToPayload(events);
    } else if (eventsDirty) {
      body.events = eventsToPayload(events);
    }

    const action = editingId
      ? await dispatch(updateTimeline({ id: editingId, body }))
      : await dispatch(createTimeline(body));
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "Error al guardar");
      return;
    }
    toast.push({
      type: "success",
      message: editingId ? "Cronología actualizada." : "Cronología creada.",
    });
    dispatch(fetchAdminTimelines());
    closeModal();
  }

  const columns = [
    {
      key: "title",
      label: "Cronología",
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--admin-text)]">{titleOf(row)}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            {row.code} · {row.events?.length ?? 0} hitos
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => <AdminBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <AdminIconButton label="Editar" onClick={() => openEdit(row)}>
            ✎
          </AdminIconButton>
          <AdminIconButton label="Archivar" danger onClick={() => onArchive(row)}>
            ⌫
          </AdminIconButton>
        </div>
      ),
    },
  ];

  return (
    <div>
      {confirm.dialog}
      <AdminPageHeader
        title="Cronologías"
        subtitle="Líneas de tiempo con hitos e imágenes por evento."
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton
              tamano="sm"
              variante="secondary"
              onClick={() => setModoOrdenar((v) => !v)}
            >
              {modoOrdenar ? "Salir" : "Reordenar"}
            </AdminButton>
            {!modoOrdenar ? (
              <AdminButton tamano="sm" onClick={openCreate}>
                + Nueva cronología
              </AdminButton>
            ) : null}
          </div>
        }
      />

      <div className="mb-6">
        <AdminStatCard label="Total cronologías" value={items.length} />
      </div>

      {modoOrdenar ? (
        <div className="mb-6">
          <p className="mb-3 text-sm text-[var(--admin-text-muted)]">
            Arrastrá para cambiar el orden. Se guarda al soltar.
          </p>
          <AdminSortableList
            items={sortableItems}
            busy={reorderBusy}
            empty="No hay cronologías para ordenar."
            onReorder={onReorderTimelines}
            renderItem={(item) => (
              <div>
                <p className="font-medium text-[var(--admin-text)]">{titleOf(item)}</p>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  {item.code} · orden {item.displayOrder ?? "—"} ·{" "}
                  {item.events?.length ?? 0} hitos
                </p>
              </div>
            )}
          />
        </div>
      ) : (
        <>
          <AdminToolbar
            search={
              <AdminSearch
                value={pager.query}
                onChange={pager.setQuery}
                placeholder="Buscar cronología…"
              />
            }
          >
            <AdminSelect
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                pager.setPage(1);
              }}
              aria-label="Filtrar por estado"
            >
              <option value="">Todos</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Borrador</option>
              <option value="ARCHIVED">Archivado</option>
            </AdminSelect>
          </AdminToolbar>

          <AdminTable
            columns={columns}
            rows={pager.pageItems}
            empty="Todavía no hay cronologías — creá la primera."
            emptyAction={
              <AdminButton tamano="sm" onClick={openCreate}>
                + Nueva cronología
              </AdminButton>
            }
          />
          <AdminPagination
            page={pager.page}
            totalPages={pager.totalPages}
            from={pager.from}
            to={pager.to}
            total={pager.total}
            onPageChange={pager.setPage}
          />
        </>
      )}

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        dirty={eventsDirty}
        title={editingId ? "Editar cronología" : "Nueva cronología"}
        subtitle="Datos de la línea + hitos anidados"
        footer={
          <AdminModalActions
            formId="timeline-form"
            onCancel={closeModal}
            saving={saving || loadingDetail}
            submitLabel="Guardar"
            dirty={eventsDirty}
          />
        }
      >
        {loadingDetail ? (
          <p className="py-8 text-center text-sm text-[var(--admin-text-muted)]">Cargando…</p>
        ) : (
          <form id="timeline-form" onSubmit={onSubmit}>
            {error ? (
              <div className="mb-4">
                <AdminAlert type="error">{error}</AdminAlert>
              </div>
            ) : null}

            <AdminSection title="Datos de la cronología">
              <AdminField
                label="Código"
                required
                hint="Solo A-Z, 0-9 y _. Ej. FRANCISCO_ARGENTINA"
              >
                <AdminInput
                  required
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: normalizeCode(e.target.value) }))
                  }
                />
              </AdminField>
              {editingId ? (
                <AdminField label="Orden" hint="Se cambia con Reordenar en el listado.">
                  <p className="py-2 text-sm text-[var(--admin-text)]">{form.displayOrder}</p>
                </AdminField>
              ) : null}
              <AdminField label="Título" required span={2}>
                <AdminInput
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: editingId ? f.slug : slugify(e.target.value),
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Slug" required span={2}>
                <AdminInput
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Descripción" span={2}>
                <AdminTextarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Estado">
                <AdminSelect
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="ARCHIVED">Archivado</option>
                </AdminSelect>
              </AdminField>
            </AdminSection>

            <section className="py-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--admin-text)]">Hitos / eventos</h3>
                  <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                    {editingId && !eventsDirty
                      ? "Sin cambios en hitos: al guardar no se tocan los events del backend."
                      : "Los hitos se envían completos al guardar."}
                  </p>
                </div>
                <AdminButton variante="secondary" tamano="sm" type="button" onClick={addEvent}>
                  + Agregar hito
                </AdminButton>
              </div>

              {events.length === 0 ? (
                <div
                  className="border border-dashed border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  Sin hitos todavía.
                </div>
              ) : (
                <AdminSortableList
                  items={events}
                  getId={(ev) => ev._key}
                  onReorder={onReorderEvents}
                  empty="Sin hitos todavía."
                  renderItem={(ev, index) => (
                    <div className="admin-nested-card !border-0 !shadow-none">
                      <button
                        type="button"
                        className="admin-nested-card__head"
                        onClick={() => updateEvent(ev._key, { open: !ev.open })}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--admin-text)]">
                            {ev.title || `Hito ${index + 1}`}
                          </span>
                          <span className="block text-xs text-[var(--admin-text-muted)]">
                            {ev.dateDescription || "Sin fecha"} · Orden {index}
                          </span>
                        </span>
                        <span className="text-[var(--admin-text-muted)]">{ev.open ? "▾" : "▸"}</span>
                      </button>
                      {ev.open ? (
                        <div className="admin-nested-card__body">
                          <AdminField label="Título" required span={2}>
                            <AdminInput
                              required
                              value={ev.title}
                              onChange={(e) => updateEvent(ev._key, { title: e.target.value })}
                            />
                          </AdminField>
                          <AdminField label="Fecha (texto)" required>
                            <AdminInput
                              required
                              placeholder="13 de marzo"
                              value={ev.dateDescription}
                              onChange={(e) =>
                                updateEvent(ev._key, { dateDescription: e.target.value })
                              }
                            />
                          </AdminField>
                          <AdminField label="Fecha inicio">
                            <AdminInput
                              type="date"
                              value={ev.startDate}
                              onChange={(e) => updateEvent(ev._key, { startDate: e.target.value })}
                            />
                          </AdminField>
                          <AdminField label="Fecha fin">
                            <AdminInput
                              type="date"
                              value={ev.endDate}
                              onChange={(e) => updateEvent(ev._key, { endDate: e.target.value })}
                            />
                          </AdminField>
                          <AdminField label="Estado">
                            <AdminSelect
                              value={ev.status}
                              onChange={(e) => updateEvent(ev._key, { status: e.target.value })}
                            >
                              <option value="DRAFT">Borrador</option>
                              <option value="PUBLISHED">Publicado</option>
                              <option value="ARCHIVED">Archivado</option>
                            </AdminSelect>
                          </AdminField>
                          <AdminField label="Descripción" span={2}>
                            <AdminTextarea
                              rows={3}
                              value={ev.description}
                              onChange={(e) =>
                                updateEvent(ev._key, { description: e.target.value })
                              }
                            />
                          </AdminField>

                          <div className="sm:col-span-2 space-y-3 border-t border-[var(--admin-border)] pt-3">
                            <p className="text-sm font-medium text-[var(--admin-text)]">
                              Imágenes del hito
                            </p>
                            <p className="text-xs text-[var(--admin-text-muted)]">
                              Desde la biblioteca de Media. Se envían en events[].images al
                              crear o al guardar hitos.
                            </p>
                            {(ev.images || []).length > 0 ? (
                              <ul className="space-y-2">
                                {(ev.images || []).map((img) => {
                                  const mid = img.mediaId || img.media?.id;
                                  const src = mediaUrl(img);
                                  return (
                                    <li
                                      key={mid}
                                      className="flex flex-wrap items-center gap-3 border border-[var(--admin-border)] px-2 py-2"
                                    >
                                      {src ? (
                                        <img
                                          src={src}
                                          alt=""
                                          className="h-12 w-12 object-cover"
                                          style={{ borderRadius: "var(--radius-sm)" }}
                                          width={48}
                                          height={48}
                                        />
                                      ) : (
                                        <div className="flex h-12 w-12 items-center justify-center bg-[var(--admin-bg)] text-xs text-[var(--admin-text-muted)]">
                                          —
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1 text-xs text-[var(--admin-text-muted)]">
                                        {img.isPrimary ? (
                                          <span className="mr-2 border border-[var(--admin-border)] px-1.5 py-0.5 uppercase tracking-wide text-[10px] text-[var(--admin-text)]">
                                            Primaria
                                          </span>
                                        ) : null}
                                        {media.find((m) => m.id === mid)?.originalFilename ||
                                          mid}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {!img.isPrimary ? (
                                          <AdminButton
                                            type="button"
                                            variante="secondary"
                                            tamano="sm"
                                            onClick={() =>
                                              setPrimaryEventImage(ev._key, mid)
                                            }
                                          >
                                            Primaria
                                          </AdminButton>
                                        ) : null}
                                        <AdminButton
                                          type="button"
                                          variante="danger"
                                          tamano="sm"
                                          onClick={() =>
                                            removeImageFromEvent(ev._key, mid)
                                          }
                                        >
                                          Quitar
                                        </AdminButton>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="text-xs text-[var(--admin-text-muted)]">
                                Sin imágenes en este hito.
                              </p>
                            )}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                              <AdminField label="Agregar de la biblioteca" className="min-w-0 flex-1">
                                <AdminSelect
                                  value={ev.pickMediaId || ""}
                                  onChange={(e) =>
                                    updateEvent(ev._key, { pickMediaId: e.target.value })
                                  }
                                >
                                  <option value="">Elegir imagen…</option>
                                  {media
                                    .filter(
                                      (m) =>
                                        !(ev.images || []).some(
                                          (img) =>
                                            (img.mediaId || img.media?.id) === m.id,
                                        ),
                                    )
                                    .map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.originalFilename || m.id}
                                      </option>
                                    ))}
                                </AdminSelect>
                              </AdminField>
                              <AdminButton
                                type="button"
                                tamano="sm"
                                disabled={!ev.pickMediaId}
                                onClick={() => addImageToEvent(ev._key)}
                              >
                                Agregar imagen
                              </AdminButton>
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <AdminButton
                              variante="danger"
                              tamano="sm"
                              type="button"
                              onClick={() => removeEvent(ev._key)}
                            >
                              Quitar hito
                            </AdminButton>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                />
              )}
            </section>
          </form>
        )}
      </AdminModal>
    </div>
  );
}
