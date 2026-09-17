import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Boton } from "../../components/ui/Boton";
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
import {
  AdminAlert,
  AdminBadge,
  AdminCheckbox,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSearch,
  AdminSection,
  AdminSelect,
  AdminTable,
  AdminTextarea,
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

export function AdminCelebrationsPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.celebrations.adminItems);
  const provinces = useSelector((state) => state.provinces.items);
  const media = useSelector((state) => state.media.items);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminCelebrations());
    dispatch(fetchProvinces());
    dispatch(fetchAdminMedia());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        if (!q) return true;
        const name = translationName(item).toLowerCase();
        const place = `${item.locality || ""} ${item.placeName || ""} ${provinceName(item)}`.toLowerCase();
        return name.includes(q) || place.includes(q) || item.status?.toLowerCase().includes(q);
      })
      .sort((a, b) => translationName(a).localeCompare(translationName(b), "es"));
  }, [items, query]);

  function setField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !editingId) next.slug = slugify(value);
      return next;
    });
  }

  function loadItem(item) {
    const tr = item.translations?.find((t) => t.locale === "es") || item.translations?.[0];
    const schedule = item.schedules?.[0];
    const scheduleTr =
      schedule?.translations?.find((t) => t.locale === "es") || schedule?.translations?.[0];
    const primary = item.images?.find((img) => img.isPrimary) || item.images?.[0];
    setEditingId(item.id);
    setForm({
      name: tr?.name || "",
      slug: tr?.slug || "",
      shortDescription: tr?.shortDescription || "",
      locality: item.locality || "",
      placeName: item.placeName || "",
      provinceId: item.provinceId || "",
      latitude: item.latitude != null ? String(Number(item.latitude)) : "",
      longitude: item.longitude != null ? String(Number(item.longitude)) : "",
      status: item.status || "DRAFT",
      isFeatured: Boolean(item.isFeatured),
      showOnMap: item.showOnMap !== false,
      showOnCalendar: item.showOnCalendar !== false,
      displayOrder: item.displayOrder != null ? String(item.displayOrder) : "",
      dateDescription: scheduleTr?.dateDescription || "",
      startMonth: schedule?.startMonth != null ? String(schedule.startMonth) : "",
      startDay: schedule?.startDay != null ? String(schedule.startDay) : "",
      endMonth: schedule?.endMonth != null ? String(schedule.endMonth) : "",
      endDay: schedule?.endDay != null ? String(schedule.endDay) : "",
      startDate: schedule?.startDate ? String(schedule.startDate).slice(0, 10) : "",
      endDate: schedule?.endDate ? String(schedule.endDate).slice(0, 10) : "",
      scheduleType: schedule?.scheduleType || "FIXED_ANNUAL",
      primaryMediaId: primary?.mediaId || "",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function buildSchedules() {
    if (!form.dateDescription && form.scheduleType !== "YEAR_ROUND") return [];

    const base = {
      scheduleType: form.scheduleType,
      startMonth: form.startMonth ? Number(form.startMonth) : null,
      startDay: form.startDay ? Number(form.startDay) : null,
      endMonth: form.endMonth ? Number(form.endMonth) : null,
      endDay: form.endDay ? Number(form.endDay) : null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      displayOrder: 0,
      translations: [
        {
          locale: "es",
          dateDescription: form.dateDescription || "Todo el año",
        },
      ],
    };
    return [base];
  }

  function buildPayload() {
    return {
      provinceId: form.provinceId || null,
      locality: form.locality || null,
      placeName: form.placeName || null,
      latitude: form.latitude !== "" ? Number(form.latitude) : null,
      longitude: form.longitude !== "" ? Number(form.longitude) : null,
      status: form.status,
      isFeatured: form.isFeatured,
      showOnMap: form.showOnMap,
      showOnCalendar: form.showOnCalendar,
      displayOrder: form.displayOrder !== "" ? Number(form.displayOrder) : null,
      translations: [
        {
          locale: "es",
          name: form.name.trim(),
          slug: (form.slug || slugify(form.name)).trim(),
          shortDescription: form.shortDescription.trim() || null,
        },
      ],
      schedules: buildSchedules(),
      ...(editingId
        ? {}
        : form.primaryMediaId
          ? {
              images: [
                {
                  mediaId: form.primaryMediaId,
                  isPrimary: true,
                  displayOrder: 0,
                  translations: [{ locale: "es", altText: form.name, caption: null }],
                },
              ],
            }
          : { images: [] }),
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const body = buildPayload();

    if (body.status === "PUBLISHED") {
      if (!body.schedules.length) {
        setSaving(false);
        setError("Para publicar necesitás una fecha / calendario.");
        return;
      }
      if (!editingId && !form.primaryMediaId) {
        body.status = "DRAFT";
        setMessage("Se guardó como borrador: para publicar hace falta una imagen primaria.");
      }
    }

    const action = editingId
      ? await dispatch(updateCelebration({ id: editingId, body }))
      : await dispatch(createCelebration(body));

    if (action.meta.requestStatus === "rejected") {
      setSaving(false);
      setError(action.payload?.message || "No se pudo guardar la fiesta");
      return;
    }

    const saved = action.payload;

    if (editingId && form.primaryMediaId) {
      const already = saved.images?.some((img) => img.mediaId === form.primaryMediaId);
      if (!already) {
        try {
          await celebrationsService.addImage(editingId, {
            mediaId: form.primaryMediaId,
            isPrimary: true,
            displayOrder: saved.images?.length || 0,
            translations: [{ locale: "es", altText: form.name, caption: null }],
          });
        } catch (err) {
          setMessage(`Fiesta guardada, pero no se pudo asociar la imagen: ${err.message}`);
          setSaving(false);
          dispatch(fetchAdminCelebrations());
          return;
        }
      }
    }

    setSaving(false);
    setMessage(editingId ? "Fiesta actualizada correctamente." : "Fiesta creada correctamente.");
    resetForm();
    dispatch(fetchAdminCelebrations());
    dispatch(fetchAdminMedia());
  }

  async function onArchive(id) {
    if (!window.confirm("¿Archivar esta fiesta? Dejará de aparecer en listados activos.")) return;
    await dispatch(archiveCelebration(id));
    if (editingId === id) resetForm();
  }

  const needsDayMonth = ["FIXED_ANNUAL", "ANNUAL_RANGE"].includes(form.scheduleType);
  const needsRange = form.scheduleType === "ANNUAL_RANGE";
  const needsExactDate = ["VARIABLE_ANNUAL", "ONE_TIME"].includes(form.scheduleType);

  const columns = [
    {
      key: "name",
      label: "Fiesta",
      render: (row) => (
        <div>
          <p className="font-medium text-azul-petroleo">{translationName(row)}</p>
          <p className="text-xs text-texto/65">
            {row.placeName || row.locality || "Sin lugar"} · {provinceName(row)}
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
      key: "flags",
      label: "Visibilidad",
      render: (row) => (
        <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wide">
          {row.showOnMap ? (
            <span className="border border-azul-logo/20 px-1.5 py-0.5">Mapa</span>
          ) : null}
          {row.showOnCalendar ? (
            <span className="border border-azul-logo/20 px-1.5 py-0.5">Calendario</span>
          ) : null}
          {row.isFeatured ? (
            <span className="border border-naranja-libro/40 text-naranja-libro px-1.5 py-0.5">
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
        <div className="flex justify-end gap-3 whitespace-nowrap">
          <button
            type="button"
            className="text-sm font-medium text-celeste-cielo hover:underline"
            onClick={() => loadItem(row)}
          >
            Editar
          </button>
          <button
            type="button"
            className="text-sm font-medium text-naranja-libro hover:underline"
            onClick={() => onArchive(row.id)}
          >
            Archivar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Fiestas"
        subtitle="Alta y edición de celebraciones: identidad, ubicación, fecha, visibilidad e imagen primaria."
        actions={
          editingId ? (
            <Boton variante="secundario" tamano="sm" onClick={resetForm}>
              Nueva fiesta
            </Boton>
          ) : null
        }
      />

      <div className="mb-4">
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nombre, lugar, provincia o estado…"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminTable
          columns={columns}
          rows={filtered}
          empty="Todavía no hay fiestas. Creá la primera con el formulario."
        />

        <form onSubmit={onSubmit}>
          <AdminPanel
            title={editingId ? "Editar fiesta" : "Nueva fiesta"}
            footer={
              <>
                <Boton type="submit" disabled={saving}>
                  {saving ? "Guardando…" : editingId ? "Guardar cambios" : "Crear fiesta"}
                </Boton>
                {editingId ? (
                  <Boton type="button" variante="secundario" onClick={resetForm}>
                    Cancelar
                  </Boton>
                ) : null}
              </>
            }
          >
            <AdminSection
              title="Identidad"
              description="Nombre público, URL amigable y texto corto para fichas y previews."
            >
              <AdminField label="Nombre de la fiesta" required span={2}>
                <AdminInput
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Ej. Señor y Virgen de la Quebrada"
                />
              </AdminField>
              <AdminField
                label="Slug"
                required
                hint="Solo minúsculas, números y guiones. Se usa en URLs."
              >
                <AdminInput
                  required
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="senor-y-virgen-de-la-quebrada"
                />
              </AdminField>
              <AdminField label="Orden de visualización" hint="Menor número = aparece antes.">
                <AdminInput
                  type="number"
                  min="0"
                  value={form.displayOrder}
                  onChange={(e) => setField("displayOrder", e.target.value)}
                  placeholder="Opcional"
                />
              </AdminField>
              <AdminField label="Descripción corta" span={2} hint="Hasta un párrafo breve.">
                <AdminTextarea
                  value={form.shortDescription}
                  onChange={(e) => setField("shortDescription", e.target.value)}
                  placeholder="Resumen para el mapa, listados y fichas."
                  rows={3}
                />
              </AdminField>
            </AdminSection>

            <AdminSection
              title="Ubicación"
              description="Datos geográficos para el mapa y filtros por provincia."
            >
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
                  placeholder="Villa de la Quebrada"
                />
              </AdminField>
              <AdminField label="Lugar / santuario">
                <AdminInput
                  value={form.placeName}
                  onChange={(e) => setField("placeName", e.target.value)}
                  placeholder="Nombre del templo o sitio"
                />
              </AdminField>
              <AdminField label="Latitud" hint="Obligatoria si se muestra en el mapa.">
                <AdminInput
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setField("latitude", e.target.value)}
                  placeholder="-33.123456"
                />
              </AdminField>
              <AdminField label="Longitud" hint="Va junto con la latitud.">
                <AdminInput
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setField("longitude", e.target.value)}
                  placeholder="-66.123456"
                />
              </AdminField>
            </AdminSection>

            <AdminSection
              title="Fecha y calendario"
              description="El backend valida el tipo de agenda. Completá los campos según el tipo elegido."
            >
              <AdminField label="Tipo de fecha" span={2}>
                <AdminSelect
                  value={form.scheduleType}
                  onChange={(e) => setField("scheduleType", e.target.value)}
                >
                  <option value="FIXED_ANNUAL">Fija cada año (día y mes)</option>
                  <option value="ANNUAL_RANGE">Rango anual (desde–hasta)</option>
                  <option value="VARIABLE_ANNUAL">Variable / móvil (fecha concreta)</option>
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
                  placeholder="3 de mayo"
                />
              </AdminField>
              {needsDayMonth ? (
                <>
                  <AdminField label="Mes de inicio" required>
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
                  <AdminField label="Día de inicio" required>
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
                  <AdminField label="Mes de fin" required>
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
                  <AdminField label="Día de fin" required>
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

            <AdminSection
              title="Visibilidad y publicación"
              description="Controlá dónde aparece y en qué estado queda."
            >
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
              <AdminField
                label="Imagen primaria"
                hint="Subí antes en Imágenes. Obligatoria para publicar."
              >
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
              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
                <AdminCheckbox
                  label="Mostrar en mapa"
                  hint="Requiere lat/lng."
                  checked={form.showOnMap}
                  onChange={(e) => setField("showOnMap", e.target.checked)}
                />
                <AdminCheckbox
                  label="Mostrar en calendario"
                  hint="Aparece mes a mes."
                  checked={form.showOnCalendar}
                  onChange={(e) => setField("showOnCalendar", e.target.checked)}
                />
                <AdminCheckbox
                  label="Destacada"
                  hint="Prioridad en listados."
                  checked={form.isFeatured}
                  onChange={(e) => setField("isFeatured", e.target.checked)}
                />
              </div>
            </AdminSection>

            {form.primaryMediaId ? (
              <div className="py-4">
                {(() => {
                  const selected = media.find((m) => m.id === form.primaryMediaId);
                  if (!selected?.url) return null;
                  return (
                    <figure className="overflow-hidden border border-azul-logo/15">
                      <img
                        src={selected.url}
                        alt=""
                        className="aspect-[16/9] w-full object-cover"
                      />
                      <figcaption className="bg-papel px-3 py-2 text-xs">
                        Vista previa · {selected.originalFilename}
                      </figcaption>
                    </figure>
                  );
                })()}
              </div>
            ) : null}

            <div className="space-y-2 py-4">
              {error ? <AdminAlert type="error">{error}</AdminAlert> : null}
              {message ? <AdminAlert type="success">{message}</AdminAlert> : null}
            </div>
          </AdminPanel>
        </form>
      </div>
    </div>
  );
}
