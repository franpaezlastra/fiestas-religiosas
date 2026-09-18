import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { celebrationsService } from "../../services";
import {
  archiveCelebration,
  createCelebration,
  fetchAdminCelebrations,
  updateCelebration,
} from "../../redux/slices/celebrationsSlice";
import { fetchAdminMedia } from "../../redux/slices/mediaSlice";
import { fetchProvinces } from "../../redux/slices/provincesSlice";
import { slugify } from "../../utils/slugify";
import { useAdminPagination } from "../hooks/useAdminPagination";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
import { AdminSortableList, nextDisplayOrder } from "../components/AdminSortableList";
import { mediaUrl, thumbUrl } from "../utils/mediaUrl";
import {
  AdminAlert,
  AdminBadge,
  AdminCheckbox,
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

const MESES = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const emptyForm = {
  name: "",
  slug: "",
  shortDescription: "",
  locality: "",
  placeName: "",
  provinceId: "",
  latitude: "",
  longitude: "",
  status: "DRAFT",
  isFeatured: false,
  showOnMap: true,
  showOnCalendar: true,
  displayOrder: "",
  dateDescription: "",
  startMonth: "",
  startDay: "",
  endMonth: "",
  endDay: "",
  startDate: "",
  endDate: "",
  scheduleType: "FIXED_ANNUAL",
  primaryMediaId: "",
};

function translationName(item) {
  return item.translations?.find((t) => t.locale === "es")?.name || "Sin nombre";
}

function provinceName(item) {
  return item.province?.name || "—";
}

function scheduleLabel(item) {
  const s = item.schedules?.[0];
  const t = s?.translations?.find((x) => x.locale === "es") || s?.translations?.[0];
  return t?.dateDescription || "—";
}

function imageCaption(img) {
  const tr = img.translations?.find((t) => t.locale === "es") || img.translations?.[0];
  return tr?.caption || "";
}

function formFromDetail(detail) {
  const tr = detail.translations?.find((t) => t.locale === "es") || detail.translations?.[0];
  const schedule = detail.schedules?.[0];
  const scheduleTr =
    schedule?.translations?.find((t) => t.locale === "es") || schedule?.translations?.[0];
  const primary = detail.images?.find((img) => img.isPrimary) || detail.images?.[0];
  return {
    name: tr?.name || "",
    slug: tr?.slug || "",
    shortDescription: tr?.shortDescription || "",
    locality: detail.locality || "",
    placeName: detail.placeName || "",
    provinceId: detail.provinceId || "",
    latitude: detail.latitude != null ? String(Number(detail.latitude)) : "",
    longitude: detail.longitude != null ? String(Number(detail.longitude)) : "",
    status: detail.status || "DRAFT",
    isFeatured: Boolean(detail.isFeatured),
    showOnMap: detail.showOnMap !== false,
    showOnCalendar: detail.showOnCalendar !== false,
    displayOrder: detail.displayOrder != null ? String(detail.displayOrder) : "",
    dateDescription: scheduleTr?.dateDescription || "",
    startMonth: schedule?.startMonth != null ? String(schedule.startMonth) : "",
    startDay: schedule?.startDay != null ? String(schedule.startDay) : "",
    endMonth: schedule?.endMonth != null ? String(schedule.endMonth) : "",
    endDay: schedule?.endDay != null ? String(schedule.endDay) : "",
    startDate: schedule?.startDate ? String(schedule.startDate).slice(0, 10) : "",
    endDate: schedule?.endDate ? String(schedule.endDate).slice(0, 10) : "",
    scheduleType: schedule?.scheduleType || "FIXED_ANNUAL",
    primaryMediaId: primary?.mediaId || "",
  };
}

export function AdminCelebrationsPage() {
  const dispatch = useDispatch();
  const toast = useAdminToast();
  const confirm = useAdminConfirm();
  const items = useSelector((state) => state.celebrations.adminItems);
  const provinces = useSelector((state) => state.provinces.items);
  const media = useSelector((state) => state.media.items);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryMediaId, setGalleryMediaId] = useState("");
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [modoOrdenar, setModoOrdenar] = useState(false);
  const [reorderBusy, setReorderBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminCelebrations());
    dispatch(fetchProvinces());
    dispatch(fetchAdminMedia());
  }, [dispatch]);

  const statusFiltered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const filterFn = useCallback((list, q) => {
    return [...list]
      .filter((item) => {
        if (!q) return true;
        const name = translationName(item).toLowerCase();
        const place = `${item.locality || ""} ${item.placeName || ""} ${provinceName(item)}`.toLowerCase();
        return name.includes(q) || place.includes(q) || item.status?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const oa = a.displayOrder ?? 9999;
        const ob = b.displayOrder ?? 9999;
        if (oa !== ob) return oa - ob;
        return translationName(a).localeCompare(translationName(b), "es");
      });
  }, []);

  const pager = useAdminPagination(statusFiltered, { filterFn });

  const sortableItems = useMemo(
    () =>
      [...statusFiltered].sort(
        (a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999),
      ),
    [statusFiltered],
  );

  const stats = useMemo(() => {
    const published = items.filter((i) => i.status === "PUBLISHED").length;
    const onMap = items.filter((i) => i.showOnMap && i.status === "PUBLISHED").length;
    return { total: items.length, published, onMap };
  }, [items]);

  function setField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !editingId) next.slug = slugify(value);
      return next;
    });
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setGalleryImages([]);
    setGalleryMediaId("");
    setMessage("");
    setError("");
    setLoadingDetail(false);
    setModalOpen(true);
  }

  async function openEdit(item) {
    setError("");
    setMessage("");
    setLoadingDetail(true);
    setModalOpen(true);
    setEditingId(item.id);
    setGalleryMediaId("");
    try {
      const detail = await celebrationsService.adminGet(item.id);
      setForm(formFromDetail(detail));
      setGalleryImages(detail.images || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar la fiesta");
      setForm(formFromDetail(item));
      setGalleryImages(item.images || []);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setGalleryImages([]);
    setGalleryMediaId("");
    setError("");
    setMessage("");
    setLoadingDetail(false);
  }

  async function refreshGallery(celebrationId) {
    const detail = await celebrationsService.adminGet(celebrationId);
    setGalleryImages(detail.images || []);
    setForm(formFromDetail(detail));
    dispatch(fetchAdminCelebrations());
    return detail;
  }

  async function onAddGalleryImage() {
    if (!editingId || !galleryMediaId) return;
    setGalleryBusy(true);
    setError("");
    try {
      await celebrationsService.addImage(editingId, {
        mediaId: galleryMediaId,
        isPrimary: galleryImages.length === 0,
        displayOrder: galleryImages.length,
        translations: [{ locale: "es", altText: form.name || null, caption: null }],
      });
      setGalleryMediaId("");
      await refreshGallery(editingId);
      toast.push({ type: "success", message: "Imagen agregada a la galería." });
    } catch (err) {
      setError(err.message || "No se pudo agregar la imagen");
    } finally {
      setGalleryBusy(false);
    }
  }

  async function onSetPrimary(imageId) {
    if (!editingId) return;
    setGalleryBusy(true);
    setError("");
    try {
      await celebrationsService.updateImage(editingId, imageId, { isPrimary: true });
      await refreshGallery(editingId);
      toast.push({ type: "success", message: "Imagen marcada como primaria." });
    } catch (err) {
      setError(err.message || "No se pudo marcar como primaria");
    } finally {
      setGalleryBusy(false);
    }
  }

  async function onRemoveGalleryImage(imageId) {
    if (!editingId) return;
    setGalleryBusy(true);
    setError("");
    try {
      await celebrationsService.removeImage(editingId, imageId);
      await refreshGallery(editingId);
      toast.push({ type: "success", message: "Imagen quitada de la galería." });
    } catch (err) {
      setError(err.message || "No se pudo quitar la imagen");
    } finally {
      setGalleryBusy(false);
    }
  }

  async function onReorderGallery(ids, reordered) {
    if (!editingId) return;
    setGalleryImages(reordered);
    setGalleryBusy(true);
    setError("");
    try {
      await celebrationsService.reorderImages(editingId, ids);
      toast.push({ type: "success", message: "Orden de la galería actualizado." });
      await refreshGallery(editingId);
    } catch (err) {
      setError(err.message || "No se pudo reordenar la galería");
      try {
        await refreshGallery(editingId);
      } catch {
        /* ignore */
      }
    } finally {
      setGalleryBusy(false);
    }
  }

  async function onReorderCelebrations(ids) {
    setReorderBusy(true);
    try {
      await celebrationsService.reorder(ids);
      toast.push({ type: "success", message: "Orden de fiestas actualizado." });
      dispatch(fetchAdminCelebrations());
    } catch (err) {
      toast.push({
        type: "error",
        message: err.message || "No se pudo reordenar las fiestas",
      });
    } finally {
      setReorderBusy(false);
    }
  }

  function buildSchedules() {
    if (!form.dateDescription && form.scheduleType !== "YEAR_ROUND") return [];

    const base = {
      scheduleType: form.scheduleType,
      displayOrder: 0,
      translations: [
        {
          locale: "es",
          dateDescription: form.dateDescription || "Todo el año",
        },
      ],
    };

    if (form.scheduleType === "YEAR_ROUND") return [base];

    if (["FIXED_ANNUAL", "ANNUAL_RANGE"].includes(form.scheduleType)) {
      base.startMonth = form.startMonth ? Number(form.startMonth) : null;
      base.startDay = form.startDay ? Number(form.startDay) : null;
    }
    if (form.scheduleType === "ANNUAL_RANGE") {
      base.endMonth = form.endMonth ? Number(form.endMonth) : null;
      base.endDay = form.endDay ? Number(form.endDay) : null;
    }
    if (["VARIABLE_ANNUAL", "ONE_TIME"].includes(form.scheduleType)) {
      base.startDate = form.startDate || null;
      base.endDate = form.endDate || null;
    }
    return [base];
  }

  function buildPayload() {
    const schedules = buildSchedules();
    const body = {
      provinceId: form.provinceId || null,
      locality: form.locality || null,
      placeName: form.placeName || null,
      latitude: form.latitude !== "" ? Number(form.latitude) : null,
      longitude: form.longitude !== "" ? Number(form.longitude) : null,
      status: form.status,
      isFeatured: form.isFeatured,
      showOnMap: form.showOnMap,
      showOnCalendar: form.showOnCalendar,
      displayOrder: editingId
        ? form.displayOrder !== ""
          ? Number(form.displayOrder)
          : null
        : nextDisplayOrder(items),
      translations: [
        {
          locale: "es",
          name: form.name.trim(),
          slug: (form.slug || slugify(form.name)).trim(),
          shortDescription: form.shortDescription.trim() || null,
        },
      ],
    };

    // Create: siempre schedules; images solo si hay primaria (o []).
    // Update: schedules solo si hay contenido; NUNCA images; NUNCA schedules: [].
    if (!editingId) {
      body.schedules = schedules;
      if (form.primaryMediaId) {
        body.images = [
          {
            mediaId: form.primaryMediaId,
            isPrimary: true,
            displayOrder: 0,
            translations: [{ locale: "es", altText: form.name, caption: null }],
          },
        ];
      } else {
        body.images = [];
      }
    } else if (schedules.length > 0) {
      body.schedules = schedules;
    }

    return body;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const body = buildPayload();

    if (body.status === "PUBLISHED") {
      const schedulesInBody = Array.isArray(body.schedules);
      if (!editingId) {
        if (!schedulesInBody || body.schedules.length === 0) {
          setSaving(false);
          setError("Para publicar necesitás una fecha / calendario.");
          return;
        }
        if (!form.primaryMediaId) {
          body.status = "DRAFT";
          setMessage("Se guardó como borrador: para publicar hace falta una imagen primaria.");
        }
      } else if (schedulesInBody && body.schedules.length === 0) {
        setSaving(false);
        setError("Para publicar necesitás una fecha / calendario.");
        return;
      }
      // Edit + PUBLISHED sin schedules en body: OK (quedan los existentes).
    }

    const action = editingId
      ? await dispatch(updateCelebration({ id: editingId, body }))
      : await dispatch(createCelebration(body));

    if (action.meta.requestStatus === "rejected") {
      setSaving(false);
      setError(action.payload?.message || "No se pudo guardar la fiesta");
      return;
    }

    setSaving(false);
    const successMsg = editingId ? "Fiesta actualizada." : "Fiesta creada.";
    setMessage(successMsg);
    toast.push({ type: "success", message: successMsg });
    dispatch(fetchAdminCelebrations());
    dispatch(fetchAdminMedia());
    setTimeout(() => closeModal(), 450);
  }

  async function onArchive(item) {
    const ok = await confirm.ask({
      title: "Archivar fiesta",
      message: `¿Archivar «${translationName(item)}»? Dejará de aparecer en el sitio público.`,
      confirmLabel: "Archivar",
    });
    if (!ok) return;

    const previousStatus = item.status || "DRAFT";
    const action = await dispatch(archiveCelebration(item.id));
    if (action.meta.requestStatus === "rejected") {
      toast.push({
        type: "error",
        message: action.payload?.message || "No se pudo archivar",
      });
      return;
    }
    if (editingId === item.id) closeModal();
    toast.push({
      type: "success",
      message: "Fiesta archivada.",
      undo: async () => {
        await dispatch(updateCelebration({ id: item.id, body: { status: previousStatus } }));
        dispatch(fetchAdminCelebrations());
      },
    });
  }

  const needsDayMonth = ["FIXED_ANNUAL", "ANNUAL_RANGE"].includes(form.scheduleType);
  const needsRange = form.scheduleType === "ANNUAL_RANGE";
  const needsExactDate = ["VARIABLE_ANNUAL", "ONE_TIME"].includes(form.scheduleType);

  const columns = [
    {
      key: "thumb",
      label: "",
      render: (row) => {
        const src = thumbUrl(row);
        return src ? (
          <img
            src={src}
            alt=""
            className="h-11 w-11 object-cover"
            style={{ borderRadius: "var(--radius-sm)" }}
            width={44}
            height={44}
          />
        ) : (
          <div
            className="flex h-11 w-11 items-center justify-center bg-[var(--admin-bg)] text-[10px] text-[var(--admin-text-muted)]"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            —
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Fiesta",
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--admin-text)]">{translationName(row)}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            {row.placeName || row.locality || "Sin lugar"} · {provinceName(row)}
          </p>
        </div>
      ),
    },
    {
      key: "date",
      label: "Fecha",
      render: (row) => <span className="text-sm">{scheduleLabel(row)}</span>,
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => <AdminBadge status={row.status} />,
    },
    {
      key: "flags",
      label: "Visibilidad",
      render: (row) => (
        <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wide">
          {row.showOnMap ? (
            <span className="border border-[var(--admin-border)] px-1.5 py-0.5">Mapa</span>
          ) : null}
          {row.showOnCalendar ? (
            <span className="border border-[var(--admin-border)] px-1.5 py-0.5">Calendario</span>
          ) : null}
          {row.isFeatured ? (
            <span className="border border-[color-mix(in_srgb,var(--admin-accent)_40%,transparent)] px-1.5 py-0.5 text-[var(--admin-accent)]">
              Destacada
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1 whitespace-nowrap">
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

  const preview = media.find((m) => m.id === form.primaryMediaId);
  const galleryMediaOptions = media.filter(
    (m) => !galleryImages.some((img) => img.mediaId === m.id),
  );

  return (
    <div>
      {confirm.dialog}

      <AdminPageHeader
        title="Fiestas"
        subtitle="Celebraciones del mapa y calendario. Datos desde GET /admin/celebrations."
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton
              tamano="sm"
              variante="secondary"
              onClick={() => setModoOrdenar((v) => !v)}
            >
              {modoOrdenar ? "Salir de ordenar" : "Reordenar"}
            </AdminButton>
            {!modoOrdenar ? (
              <AdminButton tamano="sm" onClick={openCreate}>
                + Nueva fiesta
              </AdminButton>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Total de fiestas" value={stats.total} hint="En el panel admin" />
        <AdminStatCard
          label="Publicadas"
          value={stats.published}
          hint="Visibles en el sitio"
          accent="petroleo"
        />
        <AdminStatCard
          label="En el mapa"
          value={stats.onMap}
          hint="Con showOnMap"
          accent="naranja"
        />
      </div>

      <AdminToolbar
        search={
          modoOrdenar ? null : (
            <AdminSearch
              value={pager.query}
              onChange={pager.setQuery}
              placeholder="Buscar por nombre, lugar, provincia o estado…"
            />
          )
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
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </AdminSelect>
      </AdminToolbar>

      {modoOrdenar ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--admin-text-muted)]">
            Arrastrá para cambiar el orden. Se guarda al soltar.
          </p>
          <AdminSortableList
            items={sortableItems}
            busy={reorderBusy}
            empty="No hay fiestas para reordenar."
            onReorder={onReorderCelebrations}
            renderItem={(item) => {
              const src = thumbUrl(item);
              return (
                <div className="flex items-center gap-3">
                  {src ? (
                    <img
                      src={src}
                      alt=""
                      className="h-10 w-10 object-cover"
                      style={{ borderRadius: "var(--radius-sm)" }}
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center bg-[var(--admin-bg)] text-[10px] text-[var(--admin-text-muted)]"
                      style={{ borderRadius: "var(--radius-sm)" }}
                    >
                      —
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--admin-text)]">
                      {translationName(item)}
                    </p>
                    <p className="truncate text-xs text-[var(--admin-text-muted)]">
                      Orden actual: {item.displayOrder ?? "—"} · {provinceName(item)}
                    </p>
                  </div>
                </div>
              );
            }}
          />
        </div>
      ) : (
        <>
          <AdminTable
            columns={columns}
            rows={pager.pageItems}
            empty="Todavía no hay fiestas. Creá la primera con «Nueva fiesta»."
            emptyAction={
              <AdminButton tamano="sm" onClick={openCreate}>
                Creá la primera
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
        title={editingId ? "Editar fiesta" : "Nueva fiesta"}
        subtitle="Identidad, ubicación, fecha, visibilidad e imagen primaria."
        size="xl"
        footer={
          <AdminModalActions
            formId="celebration-form"
            onCancel={closeModal}
            saving={saving || loadingDetail}
            submitLabel={editingId ? "Guardar cambios" : "Crear fiesta"}
          />
        }
      >
        {loadingDetail ? (
          <p className="py-8 text-sm text-[var(--admin-text-muted)]">Cargando fiesta…</p>
        ) : (
          <form id="celebration-form" onSubmit={onSubmit}>
            <AdminSection title="Identidad" description="Nombre público y texto corto.">
              <AdminField label="Nombre de la fiesta" required span={2}>
                <AdminInput
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Ej. Señor y Virgen de la Quebrada"
                />
              </AdminField>
              <AdminField label="Slug" required hint="Solo minúsculas, números y guiones.">
                <AdminInput
                  required
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                />
              </AdminField>
              {editingId ? (
                <AdminField label="Orden" hint="Se cambia con Reordenar en el listado.">
                  <p className="text-sm text-[var(--admin-text)]">
                    {form.displayOrder !== "" ? form.displayOrder : "—"}
                  </p>
                </AdminField>
              ) : null}
              <AdminField label="Descripción corta" span={2}>
                <AdminTextarea
                  value={form.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                  rows={3}
                  placeholder="Resumen para fichas y previews."
                />
              </AdminField>
            </AdminSection>

            <AdminSection title="Ubicación" description="Datos para el mapa.">
              <AdminField label="Provincia" span={2}>
                <AdminSelect
                  value={form.provinceId}
                  onChange={(e) => setField("provinceId", e.target.value)}
                >
                  <option value="">Sin provincia</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField label="Localidad">
                <AdminInput
                  value={form.locality}
                  onChange={(e) => setField("locality", e.target.value)}
                />
              </AdminField>
              <AdminField label="Lugar / santuario">
                <AdminInput
                  value={form.placeName}
                  onChange={(e) => setField("placeName", e.target.value)}
                />
              </AdminField>
              <AdminField label="Latitud">
                <AdminInput
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setField("latitude", e.target.value)}
                />
              </AdminField>
              <AdminField label="Longitud">
                <AdminInput
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setField("longitude", e.target.value)}
                />
              </AdminField>
            </AdminSection>

            <AdminSection title="Fecha y calendario">
              <AdminField label="Tipo de fecha" span={2}>
                <AdminSelect
                  value={form.scheduleType}
                  onChange={(e) => setField("scheduleType", e.target.value)}
                >
                  <option value="FIXED_ANNUAL">Fija cada año (día y mes)</option>
                  <option value="ANNUAL_RANGE">Rango anual</option>
                  <option value="VARIABLE_ANNUAL">Variable / móvil</option>
                  <option value="ONE_TIME">Única vez</option>
                  <option value="YEAR_ROUND">Todo el año</option>
                </AdminSelect>
              </AdminField>
              <AdminField
                label="Fecha en texto"
                required={form.scheduleType !== "YEAR_ROUND"}
                span={2}
                hint='Ej. "3 de mayo" o "Semana Santa".'
              >
                <AdminInput
                  required={form.scheduleType !== "YEAR_ROUND"}
                  value={form.dateDescription}
                  onChange={(e) => setField("dateDescription", e.target.value)}
                />
              </AdminField>
              {needsDayMonth ? (
                <>
                  <AdminField label="Mes" required>
                    <AdminSelect
                      required
                      value={form.startMonth}
                      onChange={(e) => setField("startMonth", e.target.value)}
                    >
                      <option value="">Elegir…</option>
                      {MESES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Día" required>
                    <AdminInput
                      required
                      type="number"
                      min="1"
                      max="31"
                      value={form.startDay}
                      onChange={(e) => setField("startDay", e.target.value)}
                    />
                  </AdminField>
                </>
              ) : null}
              {needsRange ? (
                <>
                  <AdminField label="Mes fin" required>
                    <AdminSelect
                      required
                      value={form.endMonth}
                      onChange={(e) => setField("endMonth", e.target.value)}
                    >
                      <option value="">Elegir…</option>
                      {MESES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminField label="Día fin" required>
                    <AdminInput
                      required
                      type="number"
                      min="1"
                      max="31"
                      value={form.endDay}
                      onChange={(e) => setField("endDay", e.target.value)}
                    />
                  </AdminField>
                </>
              ) : null}
              {needsExactDate ? (
                <>
                  <AdminField label="Fecha inicio" required>
                    <AdminInput
                      required
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setField("startDate", e.target.value)}
                    />
                  </AdminField>
                  <AdminField label="Fecha fin">
                    <AdminInput
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setField("endDate", e.target.value)}
                    />
                  </AdminField>
                </>
              ) : null}
            </AdminSection>

            <AdminSection title="Visibilidad y publicación">
              <AdminField label="Estado" required>
                <AdminSelect
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="ARCHIVED">Archivado</option>
                </AdminSelect>
              </AdminField>
              {!editingId ? (
                <AdminField label="Imagen primaria" hint="Desde la biblioteca de Imágenes.">
                  <AdminSelect
                    value={form.primaryMediaId}
                    onChange={(e) => setField("primaryMediaId", e.target.value)}
                  >
                    <option value="">Sin imagen</option>
                    {media.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.originalFilename || m.id}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
              ) : (
                <AdminField label="Galería" hint="Gestioná las fotos más abajo.">
                  <p className="text-sm text-[var(--admin-text-muted)]">
                    {galleryImages.length} imagen(es) asociadas
                  </p>
                </AdminField>
              )}
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3">
                <AdminCheckbox
                  label="Mostrar en mapa"
                  checked={form.showOnMap}
                  onChange={(e) => setField("showOnMap", e.target.checked)}
                />
                <AdminCheckbox
                  label="Mostrar en calendario"
                  checked={form.showOnCalendar}
                  onChange={(e) => setField("showOnCalendar", e.target.checked)}
                />
                <AdminCheckbox
                  label="Destacada"
                  checked={form.isFeatured}
                  onChange={(e) => setField("isFeatured", e.target.checked)}
                />
              </div>
            </AdminSection>

            {!editingId && preview?.url ? (
              <figure className="my-4 overflow-hidden border border-[var(--admin-border)]">
                <img src={preview.url} alt="" className="aspect-[16/9] w-full object-cover" />
                <figcaption className="bg-[var(--admin-surface)] px-3 py-2 text-xs">
                  {preview.originalFilename}
                </figcaption>
              </figure>
            ) : null}

            {editingId ? (
              <AdminSection
                title="Galería"
                description="Arrastrá para reordenar. Agregar, marcar primaria o quitar. No se envían images en el PATCH de la fiesta."
              >
                <div className="sm:col-span-2 space-y-3">
                  {galleryImages.length === 0 ? (
                    <p className="text-sm text-[var(--admin-text-muted)]">
                      Todavía no hay imágenes en esta fiesta.
                    </p>
                  ) : (
                    <AdminSortableList
                      items={galleryImages}
                      getId={(img) => img.id}
                      busy={galleryBusy}
                      empty="Todavía no hay imágenes en esta fiesta."
                      onReorder={onReorderGallery}
                      renderItem={(img) => {
                        const src = mediaUrl(img) || thumbUrl(img);
                        return (
                          <div className="flex items-center gap-3">
                            {src ? (
                              <img
                                src={src}
                                alt=""
                                className="h-12 w-12 shrink-0 object-cover"
                                width={48}
                                height={48}
                                style={{ borderRadius: "var(--radius-sm)" }}
                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[var(--admin-bg)] text-xs text-[var(--admin-text-muted)]">
                                —
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {img.isPrimary ? (
                                  <span className="border border-[var(--admin-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                                    Primaria
                                  </span>
                                ) : null}
                                {imageCaption(img) ? (
                                  <span className="truncate text-xs text-[var(--admin-text-muted)]">
                                    {imageCaption(img)}
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {!img.isPrimary ? (
                                  <AdminButton
                                    variante="secondary"
                                    tamano="sm"
                                    type="button"
                                    disabled={galleryBusy}
                                    onClick={() => onSetPrimary(img.id)}
                                  >
                                    Primaria
                                  </AdminButton>
                                ) : null}
                                <AdminButton
                                  variante="danger"
                                  tamano="sm"
                                  type="button"
                                  disabled={galleryBusy}
                                  onClick={() => onRemoveGalleryImage(img.id)}
                                >
                                  Quitar
                                </AdminButton>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <AdminField label="Media de la biblioteca" className="min-w-0 flex-1">
                      <AdminSelect
                        value={galleryMediaId}
                        onChange={(e) => setGalleryMediaId(e.target.value)}
                        disabled={galleryBusy}
                      >
                        <option value="">Elegir imagen…</option>
                        {galleryMediaOptions.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.originalFilename || m.id}
                          </option>
                        ))}
                      </AdminSelect>
                    </AdminField>
                    <AdminButton
                      type="button"
                      tamano="sm"
                      disabled={galleryBusy || !galleryMediaId}
                      onClick={onAddGalleryImage}
                    >
                      Agregar a galería
                    </AdminButton>
                  </div>
                </div>
              </AdminSection>
            ) : null}

            <div className="space-y-2 py-3">
              {error ? <AdminAlert type="error">{error}</AdminAlert> : null}
              {message ? <AdminAlert type="success">{message}</AdminAlert> : null}
            </div>
          </form>
        )}
      </AdminModal>
    </div>
  );
}
