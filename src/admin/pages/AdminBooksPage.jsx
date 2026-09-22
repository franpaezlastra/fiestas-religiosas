import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { booksService } from "../../services";
import {
  archiveBook,
  createBook,
  fetchAdminBooks,
  updateBook,
} from "../../redux/slices/booksSlice";
import { fetchAdminCelebrations } from "../../redux/slices/celebrationsSlice";
import { fetchAdminMedia } from "../../redux/slices/mediaSlice";
import { fetchAdminPeople } from "../../redux/slices/peopleSlice";
import { useAdminPagination } from "../hooks/useAdminPagination";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
import { AdminSortableList, nextDisplayOrder } from "../components/AdminSortableList";
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

const IMAGE_ROLES = [
  { value: "COVER", label: "Tapa (COVER)" },
  { value: "BACK_COVER", label: "Contratapa (BACK_COVER)" },
  { value: "GALLERY", label: "Galería" },
  { value: "PAPAL_DELIVERY", label: "Entrega papal" },
  { value: "OTHER", label: "Otra" },
];

const CONTRIBUTOR_ROLES = [
  { value: "AUTHOR", label: "Autor" },
  { value: "WRITER", label: "Escritor" },
  { value: "EDITOR", label: "Editor" },
  { value: "PHOTOGRAPHER", label: "Fotógrafo" },
  { value: "ILLUSTRATOR", label: "Ilustrador" },
  { value: "TRANSLATOR", label: "Traductor" },
  { value: "PROOFREADER", label: "Corrector" },
  { value: "DESIGNER", label: "Diseñador" },
  { value: "COLLABORATOR", label: "Colaborador" },
];

const emptyForm = {
  isbn: "",
  title: "",
  subtitle: "",
  description: "",
  publisher: "",
  pageCount: "",
  publicationDate: "",
  editionNumber: "",
  status: "DRAFT",
};

function titleOf(book) {
  return book.translations?.find((t) => t.locale === "es")?.title || book.isbn || "Sin título";
}

function personLabel(person) {
  if (!person) return "—";
  return (
    person.translations?.find((t) => t.locale === "es")?.displayName ||
    person.translations?.[0]?.displayName ||
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    person.id
  );
}

function celebrationLabel(item) {
  if (!item) return "—";
  return (
    item.translations?.find((t) => t.locale === "es")?.name ||
    item.translations?.[0]?.name ||
    item.id
  );
}

function mediaLabel(m) {
  return m?.originalFilename || m?.storageKey || m?.id || "—";
}

function emptyImage(order = 0) {
  return {
    _key: `img-${Date.now()}-${order}`,
    mediaId: "",
    imageRole: "GALLERY",
    displayOrder: String(order),
    open: true,
  };
}

function emptyContributor(order = 0) {
  return {
    _key: `con-${Date.now()}-${order}`,
    personId: "",
    role: "AUTHOR",
    displayOrder: String(order),
    open: true,
  };
}

function emptyCelebrationLink(order = 0) {
  return {
    _key: `cel-${Date.now()}-${order}`,
    celebrationId: "",
    mapNumber: "",
    chapterNumber: "",
    pageReference: "",
    open: true,
  };
}

function mapApiImage(img, index) {
  return {
    _key: img.id || `img-${index}`,
    mediaId: img.mediaId || "",
    imageRole: img.imageRole || "OTHER",
    displayOrder: String(img.displayOrder ?? index),
    open: false,
  };
}

function mapApiContributor(c, index) {
  return {
    _key: c.id || `con-${index}`,
    personId: c.personId || c.person?.id || "",
    role: c.role || "AUTHOR",
    displayOrder: String(c.displayOrder ?? index),
    open: false,
  };
}

function mapApiCelebration(link, index) {
  return {
    _key: link.id || `cel-${index}`,
    celebrationId: link.celebrationId || link.celebration?.id || "",
    mapNumber: link.mapNumber != null ? String(link.mapNumber) : "",
    chapterNumber: link.chapterNumber != null ? String(link.chapterNumber) : "",
    pageReference: link.pageReference || "",
    open: false,
  };
}

function imagesToPayload(images) {
  return images
    .filter((img) => img.mediaId)
    .map((img, index) => ({
      mediaId: img.mediaId,
      imageRole: img.imageRole || "OTHER",
      displayOrder: Number(img.displayOrder) || index,
    }));
}

function contributorsToPayload(contributors) {
  return contributors
    .filter((c) => c.personId)
    .map((c, index) => ({
      personId: c.personId,
      role: c.role || "AUTHOR",
      displayOrder: Number(c.displayOrder) || index,
    }));
}

function emptyPersonLink(order = 0) {
  return {
    _key: `peo-${Date.now()}-${order}`,
    personId: "",
    displayNumber: String(order + 1),
    chapterNumber: "",
    pageReference: "",
    open: true,
  };
}

function mapApiPersonLink(link, index) {
  return {
    _key: link.id || `peo-${link.personId || index}`,
    personId: link.personId || link.person?.id || "",
    displayNumber: link.displayNumber != null ? String(link.displayNumber) : "",
    chapterNumber: link.chapterNumber != null ? String(link.chapterNumber) : "",
    pageReference: link.pageReference || "",
    open: false,
  };
}

function peopleToPayload(links) {
  return links
    .filter((l) => l.personId && String(l.displayNumber).trim())
    .map((l) => ({
      personId: l.personId,
      displayNumber: Number(l.displayNumber),
      chapterNumber: l.chapterNumber ? Number(l.chapterNumber) : null,
      pageReference: (l.pageReference || "").trim() || null,
    }));
}

function celebrationsToPayload(links) {
  return links
    .filter((l) => l.celebrationId)
    .map((l) => ({
      celebrationId: l.celebrationId,
      mapNumber: l.mapNumber ? Number(l.mapNumber) : null,
      chapterNumber: l.chapterNumber ? Number(l.chapterNumber) : null,
      pageReference: l.pageReference.trim() || null,
    }));
}

function hasCoverRoles(images) {
  const roles = new Set(images.filter((i) => i.mediaId).map((i) => i.imageRole));
  return roles.has("COVER") && roles.has("BACK_COVER");
}

export function AdminBooksPage() {
  const dispatch = useDispatch();
  const toast = useAdminToast();
  const confirm = useAdminConfirm();

  const items = useSelector((state) => state.books.adminItems);
  const media = useSelector((state) => state.media.items);
  const people = useSelector((state) => state.people.adminItems);
  const celebrations = useSelector((state) => state.celebrations.adminItems);

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [celebrationLinks, setCelebrationLinks] = useState([]);
  const [peopleLinks, setPeopleLinks] = useState([]);
  const [imagesDirty, setImagesDirty] = useState(false);
  const [contributorsDirty, setContributorsDirty] = useState(false);
  const [celebrationsDirty, setCelebrationsDirty] = useState(false);
  const [peopleDirty, setPeopleDirty] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchAdminBooks());
    dispatch(fetchAdminMedia());
    dispatch(fetchAdminPeople());
    dispatch(fetchAdminCelebrations());
  }, [dispatch]);

  const statusFiltered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const filterFn = useCallback((list, q) => {
    if (!q) return list;
    return list.filter((item) =>
      `${titleOf(item)} ${item.isbn || ""} ${item.publisher || ""} ${item.status}`
        .toLowerCase()
        .includes(q),
    );
  }, []);

  const pager = useAdminPagination(statusFiltered, { filterFn });

  const stats = useMemo(() => {
    const published = items.filter((i) => i.status === "PUBLISHED").length;
    const draft = items.filter((i) => i.status === "DRAFT").length;
    return { total: items.length, published, draft };
  }, [items]);

  const nestedDirty =
    imagesDirty || contributorsDirty || celebrationsDirty || peopleDirty;

  function resetNested() {
    setImages([]);
    setContributors([]);
    setCelebrationLinks([]);
    setPeopleLinks([]);
    setImagesDirty(false);
    setContributorsDirty(false);
    setCelebrationsDirty(false);
    setPeopleDirty(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    resetNested();
    setError("");
    setLoadingDetail(false);
    setModalOpen(true);
  }

  async function openEdit(item) {
    setError("");
    setLoadingDetail(true);
    setModalOpen(true);
    setEditingId(item.id);
    try {
      const detail = await booksService.adminGet(item.id);
      applyBookDetail(detail);
    } catch {
      applyBookDetail(item);
    } finally {
      setLoadingDetail(false);
    }
  }

  function applyBookDetail(item) {
    const tr = item.translations?.find((t) => t.locale === "es") || item.translations?.[0];
    setForm({
      isbn: item.isbn || "",
      title: tr?.title || "",
      subtitle: tr?.subtitle || "",
      description: tr?.description || "",
      publisher: item.publisher || "",
      pageCount: item.pageCount != null ? String(item.pageCount) : "",
      publicationDate: item.publicationDate ? String(item.publicationDate).slice(0, 10) : "",
      editionNumber: item.editionNumber != null ? String(item.editionNumber) : "",
      status: item.status || "DRAFT",
    });
    setImages((item.images || []).map(mapApiImage));
    setContributors((item.contributors || []).map(mapApiContributor));
    setCelebrationLinks((item.celebrations || []).map(mapApiCelebration));
    setPeopleLinks((item.people || item.bookPeople || []).map(mapApiPersonLink));
    setImagesDirty(false);
    setContributorsDirty(false);
    setCelebrationsDirty(false);
    setPeopleDirty(false);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    resetNested();
    setError("");
  }

  function updateImage(key, patch) {
    setImagesDirty(true);
    setImages((list) => list.map((img) => (img._key === key ? { ...img, ...patch } : img)));
  }

  function removeImage(key) {
    setImagesDirty(true);
    setImages((list) => list.filter((img) => img._key !== key));
  }

  function addImage() {
    setImagesDirty(true);
    setImages((list) => [...list, emptyImage(nextDisplayOrder(list))]);
  }

  function onReorderImages(_ids, reordered) {
    setImagesDirty(true);
    setImages(
      reordered.map((img, index) => ({
        ...img,
        displayOrder: String(index),
      })),
    );
  }

  function updateContributor(key, patch) {
    setContributorsDirty(true);
    setContributors((list) => list.map((c) => (c._key === key ? { ...c, ...patch } : c)));
  }

  function removeContributor(key) {
    setContributorsDirty(true);
    setContributors((list) => list.filter((c) => c._key !== key));
  }

  function addContributor() {
    setContributorsDirty(true);
    setContributors((list) => [...list, emptyContributor(nextDisplayOrder(list))]);
  }

  function onReorderContributors(_ids, reordered) {
    setContributorsDirty(true);
    setContributors(
      reordered.map((c, index) => ({
        ...c,
        displayOrder: String(index),
      })),
    );
  }

  function updatePersonLink(key, patch) {
    setPeopleDirty(true);
    setPeopleLinks((list) => list.map((l) => (l._key === key ? { ...l, ...patch } : l)));
  }

  function removePersonLink(key) {
    setPeopleDirty(true);
    setPeopleLinks((list) => list.filter((l) => l._key !== key));
  }

  function addPersonLink() {
    setPeopleDirty(true);
    setPeopleLinks((list) => [...list, emptyPersonLink(list.length)]);
  }

  function updateCelebrationLink(key, patch) {
    setCelebrationsDirty(true);
    setCelebrationLinks((list) => list.map((l) => (l._key === key ? { ...l, ...patch } : l)));
  }

  function removeCelebrationLink(key) {
    setCelebrationsDirty(true);
    setCelebrationLinks((list) => list.filter((l) => l._key !== key));
  }

  function addCelebrationLink() {
    setCelebrationsDirty(true);
    setCelebrationLinks((list) => [...list, emptyCelebrationLink(list.length)]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    let status = form.status;
    const imagesPayload = imagesToPayload(images);

    if (status === "PUBLISHED" && !hasCoverRoles(images)) {
      // En update sin tocar imágenes, comprobar también las del ítem listado
      const existingRoles = new Set(
        (editingId && !imagesDirty
          ? items.find((b) => b.id === editingId)?.images || []
          : imagesPayload
        ).map((i) => i.imageRole),
      );
      const okCovers = existingRoles.has("COVER") && existingRoles.has("BACK_COVER");
      if (!okCovers) {
        const saveAsDraft = await confirm.ask({
          title: "Faltan tapa y contratapa",
          message:
            "Para publicar un libro se requieren imágenes con rol COVER y BACK_COVER. ¿Guardar como borrador (DRAFT)?",
          confirmLabel: "Guardar como borrador",
        });
        if (!saveAsDraft) {
          setError(
            "No se puede publicar sin tapa (COVER) y contratapa (BACK_COVER). Agregá ambas imágenes o guardá como borrador.",
          );
          return;
        }
        status = "DRAFT";
        setForm((f) => ({ ...f, status: "DRAFT" }));
      }
    }

    setSaving(true);
    const body = {
      isbn: form.isbn.trim(),
      publisher: form.publisher.trim() || null,
      pageCount: form.pageCount ? Number(form.pageCount) : null,
      publicationDate: form.publicationDate || null,
      editionNumber: form.editionNumber ? Number(form.editionNumber) : null,
      status,
      translations: [
        {
          locale: "es",
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          description: form.description.trim() || null,
        },
      ],
    };

    if (!editingId) {
      body.images = imagesPayload;
      body.contributors = contributorsToPayload(contributors);
      body.celebrations = celebrationsToPayload(celebrationLinks);
      body.people = peopleToPayload(peopleLinks);
    } else {
      if (imagesDirty) body.images = imagesPayload;
      if (contributorsDirty) body.contributors = contributorsToPayload(contributors);
      if (celebrationsDirty) body.celebrations = celebrationsToPayload(celebrationLinks);
      if (peopleDirty) body.people = peopleToPayload(peopleLinks);
    }

    const action = editingId
      ? await dispatch(updateBook({ id: editingId, body }))
      : await dispatch(createBook(body));
    setSaving(false);

    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "No se pudo guardar el libro");
      return;
    }

    toast.push({
      type: "success",
      message: editingId ? "Libro actualizado." : "Libro creado.",
    });
    dispatch(fetchAdminBooks());
    closeModal();
  }

  async function onArchive(item) {
    const ok = await confirm.ask({
      title: "Archivar libro",
      message: `¿Archivar «${titleOf(item)}»? Dejará de aparecer como publicado.`,
      confirmLabel: "Archivar",
    });
    if (!ok) return;

    const previousStatus = item.status || "DRAFT";
    const action = await dispatch(archiveBook(item.id));
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
      message: "Libro archivado.",
      undo: async () => {
        await dispatch(updateBook({ id: item.id, body: { status: previousStatus } }));
        dispatch(fetchAdminBooks());
      },
    });
  }

  const peopleById = useMemo(() => {
    const map = new Map();
    for (const p of people) map.set(p.id, p);
    return map;
  }, [people]);

  const celebrationsById = useMemo(() => {
    const map = new Map();
    for (const c of celebrations) map.set(c.id, c);
    return map;
  }, [celebrations]);

  const mediaById = useMemo(() => {
    const map = new Map();
    for (const m of media) map.set(m.id, m);
    return map;
  }, [media]);

  const columns = [
    {
      key: "title",
      label: "Libro",
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--admin-text)]">{titleOf(row)}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            ISBN {row.isbn}
            {row.publisher ? ` · ${row.publisher}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "nested",
      label: "Relaciones",
      render: (row) => (
        <span className="text-xs text-[var(--admin-text-muted)]">
          {(row.images?.length ?? 0)} img · {(row.contributors?.length ?? 0)} contrib. ·{" "}
          {(row.celebrations?.length ?? 0)} fiestas
        </span>
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
        title="Libros"
        subtitle="Ficha editorial con imágenes, colaboradores y vínculos a fiestas. PATCH solo envía nested si se editaron."
        actions={
          <AdminButton tamano="sm" onClick={openCreate}>
            + Nuevo libro
          </AdminButton>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Total libros" value={stats.total} hint="En el panel admin" />
        <AdminStatCard label="Publicados" value={stats.published} hint="Visibles en el sitio" />
        <AdminStatCard label="Borradores" value={stats.draft} hint="DRAFT" />
      </div>

      <AdminToolbar
        search={
          <AdminSearch
            value={pager.query}
            onChange={pager.setQuery}
            placeholder="Buscar por título, ISBN, editorial…"
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
        empty="Todavía no hay libros."
        emptyAction={
          <AdminButton tamano="sm" onClick={openCreate}>
            Creá el primero
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
        size="xl"
        dirty={nestedDirty}
        title={editingId ? "Editar libro" : "Nuevo libro"}
        subtitle="Ficha + imágenes, colaboradores y fiestas vinculadas"
        footer={
          <AdminModalActions
            formId="book-form"
            onCancel={closeModal}
            saving={saving || loadingDetail}
            submitLabel="Guardar"
            dirty={nestedDirty}
          />
        }
      >
        {loadingDetail ? (
          <p className="py-8 text-sm text-[var(--admin-text-muted)]">Cargando libro…</p>
        ) : (
        <form id="book-form" onSubmit={onSubmit}>
          {error ? (
            <div className="mb-4">
              <AdminAlert type="error">{error}</AdminAlert>
            </div>
          ) : null}

          <AdminSection title="Ficha editorial">
            <AdminField label="ISBN" required>
              <AdminInput
            required
                minLength={10}
                maxLength={20}
            value={form.isbn}
            onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Editorial">
              <AdminInput
                value={form.publisher}
                onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Título" required span={2}>
              <AdminInput
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Subtítulo" span={2}>
              <AdminInput
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Descripción" span={2}>
              <AdminTextarea
                rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Páginas">
              <AdminInput
                type="number"
                min={1}
                value={form.pageCount}
                onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Edición">
              <AdminInput
                type="number"
                min={1}
                value={form.editionNumber}
                onChange={(e) => setForm((f) => ({ ...f, editionNumber: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Fecha de publicación">
              <AdminInput
                type="date"
                value={form.publicationDate}
                onChange={(e) => setForm((f) => ({ ...f, publicationDate: e.target.value }))}
              />
            </AdminField>
            <AdminField
              label="Estado"
              hint="Publicar exige tapa (COVER) y contratapa (BACK_COVER)."
            >
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

          {/* Imágenes */}
          <section className="py-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--admin-text)]">Imágenes</h3>
                <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                  {editingId && !imagesDirty
                    ? "Sin cambios: al guardar no se tocan las imágenes del backend."
                    : "Se envían al guardar. Roles COVER y BACK_COVER son obligatorios para publicar."}
                </p>
              </div>
              <AdminButton variante="secondary" tamano="sm" type="button" onClick={addImage}>
                + Agregar imagen
              </AdminButton>
            </div>

            {images.length === 0 ? (
              <div
                className="border border-dashed border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                Sin imágenes todavía.
              </div>
            ) : (
              <AdminSortableList
                items={images}
                getId={(img) => img._key}
                onReorder={onReorderImages}
                empty="Sin imágenes todavía."
                renderItem={(img, index) => {
                  const roleLabel =
                    IMAGE_ROLES.find((r) => r.value === img.imageRole)?.label || img.imageRole;
                  const mediaName = mediaLabel(mediaById.get(img.mediaId));
                  return (
                    <div className="admin-nested-card !border-0 !shadow-none">
                      <button
                        type="button"
                        className="admin-nested-card__head"
                        onClick={() => updateImage(img._key, { open: !img.open })}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--admin-text)]">
                            {roleLabel} · {mediaName}
                          </span>
                          <span className="block text-xs text-[var(--admin-text-muted)]">
                            Imagen {index + 1} · Orden {index}
                          </span>
                        </span>
                        <span className="text-[var(--admin-text-muted)]">
                          {img.open ? "▾" : "▸"}
                        </span>
                      </button>
                      {img.open ? (
                        <div className="admin-nested-card__body">
                          <AdminField label="Media" required span={2}>
                            <AdminSelect
                              required
                              value={img.mediaId}
                              onChange={(e) => updateImage(img._key, { mediaId: e.target.value })}
                            >
                              <option value="">Elegir de la biblioteca…</option>
                              {media.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {mediaLabel(m)}
                                </option>
                              ))}
                            </AdminSelect>
                          </AdminField>
                          <AdminField label="Rol">
                            <AdminSelect
                              value={img.imageRole}
                              onChange={(e) =>
                                updateImage(img._key, { imageRole: e.target.value })
                              }
                            >
                              {IMAGE_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </AdminSelect>
                          </AdminField>
                          <div className="sm:col-span-2">
                            <AdminButton
                              variante="danger"
                              tamano="sm"
                              type="button"
                              onClick={() => removeImage(img._key)}
                            >
                              Quitar imagen
                            </AdminButton>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
            )}
          </section>

          {/* Colaboradores */}
          <section className="py-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--admin-text)]">Colaboradores</h3>
                <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                  {editingId && !contributorsDirty
                    ? "Sin cambios: al guardar no se tocan los colaboradores del backend."
                    : "Personas del admin con rol editorial."}
                </p>
              </div>
              <AdminButton
                variante="secondary"
                tamano="sm"
                type="button"
                onClick={addContributor}
              >
                + Agregar colaborador
              </AdminButton>
            </div>

            {contributors.length === 0 ? (
              <div
                className="border border-dashed border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                Sin colaboradores todavía.
              </div>
            ) : (
              <AdminSortableList
                items={contributors}
                getId={(c) => c._key}
                onReorder={onReorderContributors}
                empty="Sin colaboradores todavía."
                renderItem={(c, index) => {
                  const roleLabel =
                    CONTRIBUTOR_ROLES.find((r) => r.value === c.role)?.label || c.role;
                  const name = personLabel(peopleById.get(c.personId));
                  return (
                    <div className="admin-nested-card !border-0 !shadow-none">
                      <button
                        type="button"
                        className="admin-nested-card__head"
                        onClick={() => updateContributor(c._key, { open: !c.open })}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--admin-text)]">
                            {name} · {roleLabel}
                          </span>
                          <span className="block text-xs text-[var(--admin-text-muted)]">
                            Colaborador {index + 1} · Orden {index}
                          </span>
                        </span>
                        <span className="text-[var(--admin-text-muted)]">
                          {c.open ? "▾" : "▸"}
                        </span>
                      </button>
                      {c.open ? (
                        <div className="admin-nested-card__body">
                          <AdminField label="Persona" required span={2}>
                            <AdminSelect
                              required
                              value={c.personId}
                              onChange={(e) =>
                                updateContributor(c._key, { personId: e.target.value })
                              }
                            >
                              <option value="">Elegir persona…</option>
                              {people.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {personLabel(p)}
                                </option>
                              ))}
                            </AdminSelect>
                          </AdminField>
                          <AdminField label="Rol">
                            <AdminSelect
                              value={c.role}
                              onChange={(e) =>
                                updateContributor(c._key, { role: e.target.value })
                              }
                            >
                              {CONTRIBUTOR_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </AdminSelect>
                          </AdminField>
                          <div className="sm:col-span-2">
                            <AdminButton
                              variante="danger"
                              tamano="sm"
                              type="button"
                              onClick={() => removeContributor(c._key)}
                            >
                              Quitar colaborador
                            </AdminButton>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
            )}
          </section>

          {/* Personas del libro (mapa / santos) */}
          <section className="py-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--admin-text)]">
                  Personas del libro
                </h3>
                <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                  Campo Swagger <code>people</code>: displayNumber (nº en mapa de santos), capítulo y páginas.
                  {editingId && !peopleDirty ? " Sin cambios: no se envía al guardar." : ""}
                </p>
              </div>
              <AdminButton variante="secondary" tamano="sm" type="button" onClick={addPersonLink}>
                + Persona
              </AdminButton>
            </div>
            {peopleLinks.length === 0 ? (
              <div
                className="border border-dashed border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                Sin personas asociadas por número de mapa.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {peopleLinks.map((link, index) => (
                  <div key={link._key} className="admin-nested-card">
                    <button
                      type="button"
                      className="admin-nested-card__head"
                      onClick={() => updatePersonLink(link._key, { open: !link.open })}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[var(--admin-text)]">
                          {personLabel(people.find((p) => p.id === link.personId))} · nº{" "}
                          {link.displayNumber || "—"}
                        </span>
                        <span className="block text-xs text-[var(--admin-text-muted)]">
                          Persona {index + 1}
                        </span>
                      </span>
                      <span className="text-[var(--admin-text-muted)]">
                        {link.open ? "▾" : "▸"}
                      </span>
                    </button>
                    {link.open ? (
                      <div className="admin-nested-card__body">
                        <AdminField label="Persona" required span={2}>
                          <AdminSelect
                            required
                            value={link.personId}
                            onChange={(e) =>
                              updatePersonLink(link._key, { personId: e.target.value })
                            }
                          >
                            <option value="">Elegir persona…</option>
                            {people.map((p) => (
                              <option key={p.id} value={p.id}>
                                {personLabel(p)}
                              </option>
                            ))}
                          </AdminSelect>
                        </AdminField>
                        <AdminField label="Nº visible" required>
                          <AdminInput
                            required
                            type="number"
                            min={1}
                            value={link.displayNumber}
                            onChange={(e) =>
                              updatePersonLink(link._key, { displayNumber: e.target.value })
                            }
                          />
                        </AdminField>
                        <AdminField label="Capítulo">
                          <AdminInput
                            type="number"
                            min={1}
                            value={link.chapterNumber}
                            onChange={(e) =>
                              updatePersonLink(link._key, { chapterNumber: e.target.value })
                            }
                          />
                        </AdminField>
                        <AdminField label="Páginas" span={2}>
                          <AdminInput
                            value={link.pageReference}
                            onChange={(e) =>
                              updatePersonLink(link._key, { pageReference: e.target.value })
                            }
                          />
                        </AdminField>
                        <div className="sm:col-span-2">
                          <AdminButton
                            variante="danger"
                            tamano="sm"
                            type="button"
                            onClick={() => removePersonLink(link._key)}
                          >
                            Quitar
                          </AdminButton>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Fiestas vinculadas */}
          <section className="py-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--admin-text)]">
                  Fiestas vinculadas
                </h3>
                <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                  {editingId && !celebrationsDirty
                    ? "Sin cambios: al guardar no se tocan los vínculos del backend."
                    : "Referencias opcionales a mapa, capítulo y página."}
                </p>
              </div>
              <AdminButton
                variante="secondary"
                tamano="sm"
                type="button"
                onClick={addCelebrationLink}
              >
                + Vincular fiesta
              </AdminButton>
            </div>

            {celebrationLinks.length === 0 ? (
              <div
                className="border border-dashed border-[var(--admin-border)] px-4 py-8 text-center text-sm text-[var(--admin-text-muted)]"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                Sin fiestas vinculadas.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {celebrationLinks.map((link, index) => {
                  const name = celebrationLabel(celebrationsById.get(link.celebrationId));
                  return (
                    <div key={link._key} className="admin-nested-card">
                      <button
                        type="button"
                        className="admin-nested-card__head"
                        onClick={() =>
                          updateCelebrationLink(link._key, { open: !link.open })
                        }
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--admin-text)]">
                            {name}
                          </span>
                          <span className="block text-xs text-[var(--admin-text-muted)]">
                            Vínculo {index + 1}
                            {link.mapNumber ? ` · mapa ${link.mapNumber}` : ""}
                            {link.chapterNumber ? ` · cap. ${link.chapterNumber}` : ""}
                          </span>
                        </span>
                        <span className="text-[var(--admin-text-muted)]">
                          {link.open ? "▾" : "▸"}
                        </span>
                      </button>
                      {link.open ? (
                        <div className="admin-nested-card__body">
                          <AdminField label="Fiesta" required span={2}>
                            <AdminSelect
                              required
                              value={link.celebrationId}
                              onChange={(e) =>
                                updateCelebrationLink(link._key, {
                                  celebrationId: e.target.value,
                                })
                              }
                            >
                              <option value="">Elegir fiesta…</option>
                              {celebrations.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {celebrationLabel(c)}
                                </option>
                              ))}
                            </AdminSelect>
                          </AdminField>
                          <AdminField label="Nº de mapa">
                            <AdminInput
                              type="number"
                              min={1}
                              value={link.mapNumber}
                              onChange={(e) =>
                                updateCelebrationLink(link._key, {
                                  mapNumber: e.target.value,
                                })
                              }
                            />
                          </AdminField>
                          <AdminField label="Nº de capítulo">
                            <AdminInput
                              type="number"
                              min={1}
                              value={link.chapterNumber}
                              onChange={(e) =>
                                updateCelebrationLink(link._key, {
                                  chapterNumber: e.target.value,
                                })
                              }
                            />
                          </AdminField>
                          <AdminField label="Referencia de página" span={2}>
                            <AdminInput
                              value={link.pageReference}
                              placeholder="p. 42–45"
                              onChange={(e) =>
                                updateCelebrationLink(link._key, {
                                  pageReference: e.target.value,
                                })
                              }
                            />
                          </AdminField>
                          <div className="sm:col-span-2">
                            <AdminButton
                              variante="danger"
                              tamano="sm"
                              type="button"
                              onClick={() => removeCelebrationLink(link._key)}
                            >
                              Quitar vínculo
                            </AdminButton>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
      </form>
        )}
      </AdminModal>
    </div>
  );
}
