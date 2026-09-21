import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminMedia,
  removeMedia,
  updateMedia,
  uploadMedia,
} from "../../redux/slices/mediaSlice";
import { mediaUrl } from "../utils/mediaUrl";
import { useAdminPagination } from "../hooks/useAdminPagination";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
import {
  AdminAlert,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPagination,
  AdminSection,
  AdminStatCard,
  AdminTextarea,
} from "../components/AdminForm";

const emptyMeta = {
  title: "",
  altText: "",
  photographer: "",
  takenYear: "",
  rightsHolder: "",
};

function metaFromItem(item) {
  const tr =
    item.translations?.find((t) => t.locale === "es") ||
    item.translations?.[0] ||
    item.translation ||
    {};
  return {
    title: tr.title || item.title || "",
    altText: tr.altText || item.altText || "",
    photographer: item.photographer || "",
    takenYear: item.takenYear != null ? String(item.takenYear) : "",
    rightsHolder: item.rightsHolder || "",
  };
}

function buildMetaBody(form) {
  const body = {
    title: form.title.trim(),
    altText: form.altText.trim(),
    photographer: form.photographer.trim(),
    rightsHolder: form.rightsHolder.trim(),
  };
  if (form.takenYear.trim()) {
    const y = Number(form.takenYear);
    if (!Number.isNaN(y)) body.takenYear = y;
  }
  return body;
}

export function AdminMediaPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.media.items);
  const toast = useAdminToast();
  const confirm = useAdminConfirm();

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMeta, setUploadMeta] = useState(emptyMeta);
  const [pendingFiles, setPendingFiles] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(emptyMeta);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminMedia());
  }, [dispatch]);

  const pager = useAdminPagination(items, { pageSize: 12 });

  const totalBytes = useMemo(
    () => items.reduce((sum, m) => sum + (Number(m.sizeBytes) || 0), 0),
    [items],
  );

  function openUpload() {
    setUploadMeta(emptyMeta);
    setPendingFiles(null);
    setError("");
    setUploadOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setEditForm(metaFromItem(item));
    setDirty(false);
    setError("");
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditing(null);
    setEditForm(emptyMeta);
    setDirty(false);
  }

  async function onUploadSubmit(e) {
    e.preventDefault();
    if (!pendingFiles?.length) {
      setError("Elegí al menos una imagen.");
      return;
    }
    setBusy(true);
    setError("");
    const metadata = buildMetaBody(uploadMeta);
    const action = await dispatch(uploadMedia({ files: pendingFiles, metadata }));
    setBusy(false);
    if (action.meta.requestStatus === "rejected") {
      setError(
        action.payload?.message ||
          "No se pudo subir. Configurá Cloudinary en el backend.",
      );
      return;
    }
    setUploadOpen(false);
    setPendingFiles(null);
    setUploadMeta(emptyMeta);
    toast.push({
      type: "success",
      message: `${pendingFiles.length} imagen(es) subida(s).`,
    });
    dispatch(fetchAdminMedia());
  }

  async function onEditSubmit(e) {
    e.preventDefault();
    if (!editing) return;
    const body = {
      title: editForm.title.trim() || undefined,
      altText: editForm.altText.trim() || undefined,
      photographer: editForm.photographer.trim() || undefined,
      rightsHolder: editForm.rightsHolder.trim() || undefined,
    };
    if (editForm.takenYear.trim()) {
      body.takenYear = Number(editForm.takenYear);
    }
    // Quitar undefined
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
    if (!Object.keys(body).length) {
      setError("Completá al menos un campo de metadata.");
      return;
    }

    setSaving(true);
    setError("");
    const action = await dispatch(updateMedia({ id: editing.id, body }));
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "No se pudo guardar");
      return;
    }
    toast.push({ type: "success", message: "Metadata actualizada." });
    closeEdit();
    dispatch(fetchAdminMedia());
  }

  async function onDelete(item) {
    const ok = await confirm.ask({
      title: "Borrar imagen",
      message: `¿Borrar «${item.originalFilename || item.id}»? Si está en uso en fiestas/personas/libros, el backend puede rechazar la operación.`,
      confirmLabel: "Borrar",
    });
    if (!ok) return;
    const action = await dispatch(removeMedia(item.id));
    if (action.meta.requestStatus === "rejected") {
      toast.push({
        type: "error",
        message: action.payload?.message || "No se pudo borrar (¿en uso?)",
      });
      return;
    }
    if (editing?.id === item.id) closeEdit();
    toast.push({ type: "success", message: "Imagen eliminada." });
  }

  return (
    <div>
      {confirm.dialog}
      <AdminPageHeader
        title="Imágenes"
        subtitle="Biblioteca Cloudinary. Subí, editá metadata y asociá en fiestas/personas/libros."
        actions={
          <AdminButton tamano="sm" onClick={openUpload}>
            + Subir imágenes
          </AdminButton>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <AdminStatCard label="Total imágenes" value={items.length} />
        <AdminStatCard
          label="Peso aprox."
          value={`${(totalBytes / 1e6).toFixed(1)} MB`}
        />
      </div>

      <div className="mb-6">
        <AdminAlert type="info">
          Máximo 5 archivos por carga y 15 MB por imagen. La metadata se puede
          completar al subir o editar después.
        </AdminAlert>
      </div>

      {items.length === 0 ? (
        <div
          className="border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <p className="mb-4 text-sm text-[var(--admin-text-muted)]">
            Todavía no hay imágenes en la biblioteca.
          </p>
          <AdminButton tamano="sm" onClick={openUpload}>
            Subí la primera
          </AdminButton>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pager.pageItems.map((item) => {
              const url = mediaUrl(item);
              const meta = metaFromItem(item);
              return (
                <figure
                  key={item.id}
                  className="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-[var(--shadow-card)]"
                  style={{ borderRadius: "var(--radius-lg)" }}
                >
                  {url ? (
                    <img
                      src={url}
                      alt={meta.altText || meta.title || ""}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-[var(--admin-bg)] text-xs text-[var(--admin-text-muted)]">
                      Sin URL
                    </div>
                  )}
                  <figcaption className="space-y-2 p-3">
                    <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                      {meta.title || item.originalFilename || "Sin título"}
                    </p>
                    <p className="truncate text-xs text-[var(--admin-text-muted)]">
                      {item.originalFilename}
                      {meta.photographer ? ` · ${meta.photographer}` : ""}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <AdminButton
                        variante="secondary"
                        tamano="sm"
                        onClick={() => openEdit(item)}
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        variante="danger"
                        tamano="sm"
                        onClick={() => onDelete(item)}
                      >
                        Borrar
                      </AdminButton>
                    </div>
                  </figcaption>
                </figure>
              );
            })}
          </div>
          <div className="mt-4">
            <AdminPagination
              page={pager.page}
              totalPages={pager.totalPages}
              from={pager.from}
              to={pager.to}
              total={pager.total}
              onPageChange={pager.setPage}
            />
          </div>
        </>
      )}

      <AdminModal
        open={uploadOpen}
        onClose={() => !busy && setUploadOpen(false)}
        title="Subir imágenes"
        size="md"
        dirty={Boolean(pendingFiles?.length)}
        footer={
          <AdminModalActions
            formId="media-upload-form"
            onCancel={() => setUploadOpen(false)}
            saving={busy}
            submitLabel={busy ? "Subiendo…" : "Subir"}
            dirty={Boolean(pendingFiles?.length)}
          />
        }
      >
        <form id="media-upload-form" onSubmit={onUploadSubmit}>
          <AdminSection title="Archivos">
            <AdminField label="Imágenes" required span={2}>
              <input
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-sm text-[var(--admin-text)]"
                disabled={busy}
                onChange={(e) => setPendingFiles(e.target.files)}
              />
            </AdminField>
          </AdminSection>
          <AdminSection title="Metadata (opcional, aplica a todos)">
            <AdminField label="Título" span={2}>
              <AdminInput
                value={uploadMeta.title}
                onChange={(e) =>
                  setUploadMeta((f) => ({ ...f, title: e.target.value }))
                }
              />
            </AdminField>
            <AdminField label="Texto alt" span={2}>
              <AdminInput
                value={uploadMeta.altText}
                onChange={(e) =>
                  setUploadMeta((f) => ({ ...f, altText: e.target.value }))
                }
              />
            </AdminField>
            <AdminField label="Fotógrafo">
              <AdminInput
                value={uploadMeta.photographer}
                onChange={(e) =>
                  setUploadMeta((f) => ({ ...f, photographer: e.target.value }))
                }
              />
            </AdminField>
            <AdminField label="Año">
              <AdminInput
                type="number"
                min={1800}
                max={2200}
                value={uploadMeta.takenYear}
                onChange={(e) =>
                  setUploadMeta((f) => ({ ...f, takenYear: e.target.value }))
                }
              />
            </AdminField>
            <AdminField label="Titular de derechos" span={2}>
              <AdminInput
                value={uploadMeta.rightsHolder}
                onChange={(e) =>
                  setUploadMeta((f) => ({ ...f, rightsHolder: e.target.value }))
                }
              />
            </AdminField>
          </AdminSection>
          {error ? (
            <div className="py-3">
              <AdminAlert type="error">{error}</AdminAlert>
            </div>
          ) : null}
        </form>
      </AdminModal>

      <AdminModal
        open={editOpen}
        onClose={closeEdit}
        title="Editar metadata"
        size="md"
        dirty={dirty}
        footer={
          <AdminModalActions
            formId="media-edit-form"
            onCancel={closeEdit}
            saving={saving}
            submitLabel="Guardar"
            dirty={dirty}
          />
        }
      >
        {editing ? (
          <form id="media-edit-form" onSubmit={onEditSubmit}>
            {mediaUrl(editing) ? (
              <img
                src={mediaUrl(editing)}
                alt=""
                className="mb-4 aspect-[16/9] w-full object-cover"
                style={{ borderRadius: "var(--radius-md)" }}
              />
            ) : null}
            <p className="mb-4 truncate text-xs text-[var(--admin-text-muted)]">
              {editing.originalFilename} · {editing.id}
            </p>
            <AdminSection title="Metadata">
              <AdminField label="Título" span={2}>
                <AdminInput
                  value={editForm.title}
                  onChange={(e) => {
                    setDirty(true);
                    setEditForm((f) => ({ ...f, title: e.target.value }));
                  }}
                />
              </AdminField>
              <AdminField label="Texto alt" span={2}>
                <AdminTextarea
                  rows={2}
                  value={editForm.altText}
                  onChange={(e) => {
                    setDirty(true);
                    setEditForm((f) => ({ ...f, altText: e.target.value }));
                  }}
                />
              </AdminField>
              <AdminField label="Fotógrafo">
                <AdminInput
                  value={editForm.photographer}
                  onChange={(e) => {
                    setDirty(true);
                    setEditForm((f) => ({ ...f, photographer: e.target.value }));
                  }}
                />
              </AdminField>
              <AdminField label="Año">
                <AdminInput
                  type="number"
                  min={1800}
                  max={2200}
                  value={editForm.takenYear}
                  onChange={(e) => {
                    setDirty(true);
                    setEditForm((f) => ({ ...f, takenYear: e.target.value }));
                  }}
                />
              </AdminField>
              <AdminField label="Titular de derechos" span={2}>
                <AdminInput
                  value={editForm.rightsHolder}
                  onChange={(e) => {
                    setDirty(true);
                    setEditForm((f) => ({ ...f, rightsHolder: e.target.value }));
                  }}
                />
              </AdminField>
            </AdminSection>
            {error ? (
              <div className="py-3">
                <AdminAlert type="error">{error}</AdminAlert>
              </div>
            ) : null}
          </form>
        ) : null}
      </AdminModal>
    </div>
  );
}
