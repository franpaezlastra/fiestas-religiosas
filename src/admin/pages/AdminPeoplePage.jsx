import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { peopleService } from "../../services";
import {
  archivePerson,
  createPerson,
  fetchAdminPeople,
  updatePerson,
} from "../../redux/slices/peopleSlice";
import { fetchAdminBooks } from "../../redux/slices/booksSlice";
import { fetchAdminMedia } from "../../redux/slices/mediaSlice";
import { slugify } from "../../utils/slugify";
import { useAdminPagination } from "../hooks/useAdminPagination";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
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

const emptyForm = {
  displayName: "",
  slug: "",
  firstName: "",
  lastName: "",
  birthPlace: "",
  birthDate: "",
  deathDate: "",
  nationalityCode: "",
  canonizationStage: "",
  isFeatured: false,
  featuredDisplayOrder: "",
  status: "DRAFT",
  shortBio: "",
  biography: "",
  bookId: "",
  displayNumber: "",
  chapterNumber: "",
  pageReference: "",
};

const STAGE_LABELS = {
  SAINT: "Santo",
  BLESSED: "Beato",
  VENERABLE: "Venerable",
  SERVANT_OF_GOD: "Siervo de Dios",
  PRE_CAUSE: "Pre-causa",
};

function nameOf(person) {
  return person.translations?.find((t) => t.locale === "es")?.displayName || person.id;
}

function stageOf(person) {
  if (person.canonizationStage) return person.canonizationStage;
  const role = person.roles?.[0]?.role;
  if (role === "SAINT") return "SAINT";
  if (role === "BLESSED") return "BLESSED";
  if (role === "FEATURED_PERSON") return "SERVANT_OF_GOD";
  return null;
}

function stageLabel(person) {
  const stage = stageOf(person);
  if (STAGE_LABELS[stage]) return STAGE_LABELS[stage];
  if (person.isFeatured) return "Destacado";
  return "—";
}

function bookTitle(book) {
  if (!book) return "Libro";
  return (
    book.translations?.find((t) => t.locale === "es")?.title ||
    book.title ||
    book.isbn ||
    book.id
  );
}

function dateInputValue(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formFromDetail(detail) {
  const tr = detail.translations?.find((t) => t.locale === "es") || detail.translations?.[0];
  const assoc = detail.bookAssociations?.[0] || detail.books?.[0];
  return {
    displayName: tr?.displayName || "",
    slug: tr?.slug || "",
    firstName: detail.firstName || "",
    lastName: detail.lastName || "",
    birthPlace: tr?.birthPlace || "",
    birthDate: dateInputValue(detail.birthDate),
    deathDate: dateInputValue(detail.deathDate),
    nationalityCode: detail.nationalityCode || "",
    canonizationStage: stageOf(detail) || "",
    isFeatured: Boolean(detail.isFeatured),
    featuredDisplayOrder:
      detail.featuredDisplayOrder != null ? String(detail.featuredDisplayOrder) : "",
    status: detail.status || "DRAFT",
    shortBio: tr?.shortBio || "",
    biography: tr?.biography || "",
    bookId: assoc?.bookId || assoc?.book?.id || "",
    displayNumber: assoc?.displayNumber != null ? String(assoc.displayNumber) : "",
    chapterNumber: assoc?.chapterNumber != null ? String(assoc.chapterNumber) : "",
    pageReference: assoc?.pageReference || "",
  };
}

function buildTranslations(form) {
  return [
    {
      locale: "es",
      displayName: form.displayName.trim(),
      slug: (form.slug || slugify(form.displayName)).trim(),
      shortBio: form.shortBio.trim() || null,
      biography: form.biography.trim() || null,
      birthPlace: form.birthPlace.trim() || null,
    },
  ];
}

function serializeImages(images, displayName = "") {
  return (images || []).map((img, index) => {
    const mediaId = img.mediaId || img.media?.id;
    const trs =
      img.translations?.length > 0
        ? img.translations.map((t) => ({
            locale: t.locale,
            caption: t.caption ?? null,
            altText: t.altText ?? null,
          }))
        : [
            {
              locale: "es",
              caption: null,
              altText: displayName || null,
            },
          ];
    return {
      mediaId,
      isPrimary: Boolean(img.isPrimary) || index === 0,
      displayOrder: img.displayOrder ?? index,
      translations: trs,
    };
  });
}

function imageCaption(img) {
  const tr = img.translations?.find((t) => t.locale === "es") || img.translations?.[0];
  return tr?.caption || "";
}

export function AdminPeoplePage() {
  const dispatch = useDispatch();
  const toast = useAdminToast();
  const confirm = useAdminConfirm();
  const items = useSelector((state) => state.people.adminItems);
  const media = useSelector((state) => state.media.items);
  const books = useSelector((state) => state.books.adminItems);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [personImages, setPersonImages] = useState([]);
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [imagesDirty, setImagesDirty] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchAdminPeople());
    dispatch(fetchAdminMedia());
    dispatch(fetchAdminBooks());
  }, [dispatch]);

  const statusFiltered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const filterFn = useCallback((list, q) => {
    if (!q) return list;
    return list.filter((item) =>
      `${nameOf(item)} ${stageLabel(item)} ${item.status}`.toLowerCase().includes(q),
    );
  }, []);

  const pager = useAdminPagination(statusFiltered, { filterFn });

  const stats = useMemo(() => {
    const published = items.filter((i) => i.status === "PUBLISHED").length;
    const drafts = items.filter((i) => i.status === "DRAFT").length;
    return { total: items.length, published, drafts };
  }, [items]);

  function setField(key, value) {
    setFormDirty(true);
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "displayName" && !editingId) next.slug = slugify(value);
      if (key === "nationalityCode") {
        next.nationalityCode = String(value)
          .replace(/[^a-zA-Z]/g, "")
          .slice(0, 2)
          .toUpperCase();
      }
      return next;
    });
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setPersonImages([]);
    setSelectedMediaId("");
    setImagesDirty(false);
    setFormDirty(false);
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
    setSelectedMediaId("");
    setImagesDirty(false);
    setFormDirty(false);
    try {
      const detail = await peopleService.adminGet(item.id);
      setForm(formFromDetail(detail));
      setPersonImages(detail.images || []);
    } catch (err) {
      setError(err.message || "No se pudo cargar la persona");
      setForm(formFromDetail(item));
      setPersonImages(item.images || []);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setPersonImages([]);
    setSelectedMediaId("");
    setImagesDirty(false);
    setFormDirty(false);
    setError("");
    setMessage("");
    setLoadingDetail(false);
    setImageBusy(false);
  }

  function buildScalarBody() {
    const nationality = form.nationalityCode.trim().toUpperCase();
    return {
      firstName: form.firstName.trim() || null,
      lastName: form.lastName.trim() || null,
      birthDate: form.birthDate || null,
      deathDate: form.deathDate || null,
      nationalityCode: nationality.length === 2 ? nationality : null,
      status: form.status,
      translations: buildTranslations(form),
      isFeatured: Boolean(form.isFeatured),
      featuredDisplayOrder:
        form.featuredDisplayOrder.trim() !== ""
          ? Number(form.featuredDisplayOrder)
          : null,
      canonizationStage: form.canonizationStage || null,
    };
  }

  function buildBookAssociations() {
    if (!form.bookId || !form.displayNumber.trim()) return [];
    const assoc = {
      bookId: form.bookId,
      displayNumber: Number(form.displayNumber),
    };
    if (form.chapterNumber.trim()) assoc.chapterNumber = Number(form.chapterNumber);
    if (form.pageReference.trim()) assoc.pageReference = form.pageReference.trim();
    return [assoc];
  }

  async function onAddImage() {
    if (!selectedMediaId) return;

    const already = personImages.some(
      (img) => (img.mediaId || img.media?.id) === selectedMediaId,
    );
    if (already) {
      setError("Esa imagen ya está asociada a esta persona.");
      return;
    }

    const nextImages = [
      ...personImages,
      {
        mediaId: selectedMediaId,
        isPrimary: personImages.length === 0,
        displayOrder: personImages.length,
        translations: [
          {
            locale: "es",
            caption: null,
            altText: form.displayName || null,
          },
        ],
        media: media.find((m) => m.id === selectedMediaId),
      },
    ];

    // Create: solo estado local; se envía en el POST.
    if (!editingId) {
      setPersonImages(nextImages);
      setSelectedMediaId("");
      setImagesDirty(true);
      return;
    }

    setImageBusy(true);
    setError("");
    try {
      const body = {
        ...buildScalarBody(),
        images: serializeImages(nextImages, form.displayName),
      };
      const updated = await peopleService.update(editingId, body);
      setPersonImages(updated.images || nextImages);
      setSelectedMediaId("");
      setImagesDirty(false);
      setMessage("Imagen agregada.");
      toast.push({ type: "success", message: "Imagen agregada." });
      dispatch(fetchAdminPeople());
    } catch (err) {
      setError(err.message || "No se pudo agregar la imagen");
    } finally {
      setImageBusy(false);
    }
  }

  async function onRemoveImage(mediaId) {
    const normalized = personImages
      .filter((img) => (img.mediaId || img.media?.id) !== mediaId)
      .map((img, index) => ({
        ...img,
        isPrimary: index === 0,
        displayOrder: index,
      }));

    if (!editingId) {
      setPersonImages(normalized);
      setImagesDirty(true);
      return;
    }

    setImageBusy(true);
    setError("");
    try {
      const body = {
        ...buildScalarBody(),
        images: serializeImages(normalized, form.displayName),
      };
      const updated = await peopleService.update(editingId, body);
      setPersonImages(updated.images || normalized);
      setImagesDirty(false);
      setMessage("Imagen quitada.");
      toast.push({ type: "success", message: "Imagen quitada." });
      dispatch(fetchAdminPeople());
    } catch (err) {
      setError(err.message || "No se pudo quitar la imagen");
    } finally {
      setImageBusy(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    const body = buildScalarBody();

    if (!editingId) {
      body.images = serializeImages(personImages, form.displayName);
      body.bookAssociations = buildBookAssociations();
    } else if (imagesDirty) {
      body.images = serializeImages(personImages, form.displayName);
    }

    const action = editingId
      ? await dispatch(updatePerson({ id: editingId, body }))
      : await dispatch(createPerson(body));

    if (action.meta.requestStatus === "rejected") {
      setSaving(false);
      setError(action.payload?.message || "No se pudo guardar la persona");
      return;
    }

    setSaving(false);
    const successMsg = editingId ? "Persona actualizada." : "Persona creada.";
    setMessage(successMsg);
    toast.push({ type: "success", message: successMsg });
    setImagesDirty(false);
    setFormDirty(false);
    dispatch(fetchAdminPeople());
    dispatch(fetchAdminMedia());
    setTimeout(() => closeModal(), 450);
  }

  async function onArchive(item) {
    const ok = await confirm.ask({
      title: "Archivar persona",
      message: `¿Archivar «${nameOf(item)}»? Dejará de aparecer en el sitio público.`,
      confirmLabel: "Archivar",
    });
    if (!ok) return;

    const previousStatus = item.status || "DRAFT";
    const action = await dispatch(archivePerson(item.id));
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
      message: "Persona archivada.",
      undo: async () => {
        await dispatch(updatePerson({ id: item.id, body: { status: previousStatus } }));
        dispatch(fetchAdminPeople());
      },
    });
  }

  const mediaOptions = media.filter(
    (m) => !personImages.some((img) => (img.mediaId || img.media?.id) === m.id),
  );

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
      label: "Persona",
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--admin-text)]">{nameOf(row)}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{stageLabel(row)}</p>
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

  return (
    <div>
      {confirm.dialog}

      <AdminPageHeader
        title="Personas"
        subtitle="Santos, beatos y figuras destacadas. Datos desde GET /admin/people."
        actions={
          <AdminButton tamano="sm" onClick={openCreate}>
            + Nueva persona
          </AdminButton>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Total personas" value={stats.total} hint="En el panel admin" />
        <AdminStatCard
          label="Publicadas"
          value={stats.published}
          hint="Visibles en el sitio"
          accent="petroleo"
        />
        <AdminStatCard
          label="Borradores"
          value={stats.drafts}
          hint="Sin publicar"
          accent="naranja"
        />
      </div>

      <AdminToolbar
        search={
          <AdminSearch
            value={pager.query}
            onChange={pager.setQuery}
            placeholder="Buscar persona, etapa o estado…"
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
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </AdminSelect>
      </AdminToolbar>

      <AdminTable
        columns={columns}
        rows={pager.pageItems}
        empty="Todavía no hay personas. Creá la primera con «Nueva persona»."
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

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Editar persona" : "Nueva persona"}
        subtitle="Swagger PersonInput: canonizationStage, isFeatured, images, bookAssociations."
        size="lg"
        dirty={formDirty || imagesDirty}
        footer={
          <AdminModalActions
            formId="person-form"
            onCancel={closeModal}
            saving={saving || loadingDetail}
            submitLabel="Guardar"
            dirty={formDirty || imagesDirty}
          />
        }
      >
        {loadingDetail ? (
          <p className="py-8 text-center text-sm text-[var(--admin-text-muted)]">
            Cargando persona…
          </p>
        ) : (
          <form id="person-form" onSubmit={onSubmit}>
            <AdminSection title="Identidad">
              <AdminField label="Nombre para mostrar" required span={2}>
                <AdminInput
                  required
                  value={form.displayName}
                  onChange={(e) => setField("displayName", e.target.value)}
                />
              </AdminField>
              <AdminField label="Slug" required>
                <AdminInput
                  required
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                />
              </AdminField>
              <AdminField label="Nombre">
                <AdminInput
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                />
              </AdminField>
              <AdminField label="Apellido">
                <AdminInput
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </AdminField>
              <AdminField label="Lugar de nacimiento">
                <AdminInput
                  value={form.birthPlace}
                  onChange={(e) => setField("birthPlace", e.target.value)}
                />
              </AdminField>
              <AdminField label="Fecha de nacimiento">
                <AdminInput
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setField("birthDate", e.target.value)}
                />
              </AdminField>
              <AdminField label="Fecha de fallecimiento">
                <AdminInput
                  type="date"
                  value={form.deathDate}
                  onChange={(e) => setField("deathDate", e.target.value)}
                />
              </AdminField>
              <AdminField label="Nacionalidad (código ISO, 2 letras)">
                <AdminInput
                  value={form.nationalityCode}
                  maxLength={2}
                  placeholder="AR"
                  onChange={(e) => setField("nationalityCode", e.target.value)}
                />
              </AdminField>
            </AdminSection>

            <AdminSection title="Canonización y visibilidad">
              <AdminField
                label="Etapa de canonización"
                hint="canonizationStage (reemplaza roles SAINT/BLESSED)."
                span={2}
              >
                <AdminSelect
                  value={form.canonizationStage}
                  onChange={(e) => setField("canonizationStage", e.target.value)}
                >
                  <option value="">Sin etapa</option>
                  <option value="SAINT">Santo</option>
                  <option value="BLESSED">Beato</option>
                  <option value="VENERABLE">Venerable</option>
                  <option value="SERVANT_OF_GOD">Siervo de Dios</option>
                  <option value="PRE_CAUSE">Pre-causa</option>
                </AdminSelect>
              </AdminField>
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
              <AdminField label="Orden destacado" hint="featuredDisplayOrder">
                <AdminInput
                  type="number"
                  min={0}
                  value={form.featuredDisplayOrder}
                  onChange={(e) => setField("featuredDisplayOrder", e.target.value)}
                  placeholder="opcional"
                />
              </AdminField>
              <div className="sm:col-span-2">
                <AdminCheckbox
                  label="Destacada (isFeatured)"
                  checked={form.isFeatured}
                  onChange={(e) => setField("isFeatured", e.target.checked)}
                />
              </div>
            </AdminSection>

            {!editingId ? (
              <AdminSection
                title="Asociación a libro"
                description="Opcional al crear (bookAssociations). Después se gestiona desde Libros."
              >
                <AdminField label="Libro" span={2}>
                  <AdminSelect
                    value={form.bookId}
                    onChange={(e) => setField("bookId", e.target.value)}
                  >
                    <option value="">Sin libro</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {bookTitle(b)}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Nº visible" hint="displayNumber (mapa de santos)" required={Boolean(form.bookId)}>
                  <AdminInput
                    type="number"
                    min={1}
                    required={Boolean(form.bookId)}
                    value={form.displayNumber}
                    onChange={(e) => setField("displayNumber", e.target.value)}
                    placeholder="ej. 12"
                  />
                </AdminField>
                <AdminField label="Capítulo">
                  <AdminInput
                    type="number"
                    min={1}
                    value={form.chapterNumber}
                    onChange={(e) => setField("chapterNumber", e.target.value)}
                  />
                </AdminField>
                <AdminField label="Páginas" span={2}>
                  <AdminInput
                    value={form.pageReference}
                    onChange={(e) => setField("pageReference", e.target.value)}
                    placeholder='ej. "40-41"'
                  />
                </AdminField>
              </AdminSection>
            ) : null}

            <AdminSection title="Biografía">
              <AdminField label="Bio corta" span={2}>
                <AdminTextarea
                  rows={3}
                  value={form.shortBio}
                  onChange={(e) => setField("shortBio", e.target.value)}
                />
              </AdminField>
              <AdminField label="Biografía completa" span={2}>
                <AdminTextarea
                  rows={6}
                  value={form.biography}
                  onChange={(e) => setField("biography", e.target.value)}
                />
              </AdminField>
            </AdminSection>

            <AdminSection
              title="Imágenes"
              description={
                editingId
                  ? "People no tiene endpoints de imagen: agregar/quitar hace PATCH con el array completo (roles + translations + images). Guardar ficha sin tocar imágenes omite la clave images."
                  : "Opcional al crear. Si no elegís ninguna, se envía images: []."
              }
            >
              <div className="sm:col-span-2 space-y-3">
                {personImages.length === 0 ? (
                  <p className="text-sm text-[var(--admin-text-muted)]">
                    Todavía no hay imágenes asociadas.
                  </p>
                ) : (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {personImages.map((img) => {
                      const mid = img.mediaId || img.media?.id;
                      const src = mediaUrl(img) || thumbUrl(img);
                      return (
                        <li
                          key={img.id || mid}
                          className="flex gap-3 border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"
                          style={{ borderRadius: "var(--radius-md)" }}
                        >
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
                            <div className="mt-2">
                              <AdminButton
                                variante="danger"
                                tamano="sm"
                                type="button"
                                disabled={imageBusy}
                                onClick={() => onRemoveImage(mid)}
                              >
                                Quitar
                              </AdminButton>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <AdminField label="Media de la biblioteca" className="min-w-0 flex-1">
                    <AdminSelect
                      value={selectedMediaId}
                      onChange={(e) => setSelectedMediaId(e.target.value)}
                      disabled={imageBusy}
                    >
                      <option value="">Elegí una imagen…</option>
                      {mediaOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.originalFilename || m.id}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminButton
                    variante="secondary"
                    tamano="sm"
                    type="button"
                    disabled={!selectedMediaId || imageBusy}
                    onClick={onAddImage}
                  >
                    Agregar imagen
                  </AdminButton>
                </div>
              </div>
            </AdminSection>

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
