import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  archiveVideo,
  createVideo,
  fetchAdminVideos,
  updateVideo,
} from "../../redux/slices/videosSlice";
import { useAdminPagination } from "../hooks/useAdminPagination";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
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

const empty = {
  externalId: "",
  title: "",
  description: "",
  displayOrder: "0",
  status: "DRAFT",
  durationSeconds: "",
  sourcePublishedAt: "",
};

function titleOf(video) {
  return video.translations?.find((t) => t.locale === "es")?.title || video.externalId;
}

export function AdminVideosPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.videos.adminItems);
  const toast = useAdminToast();
  const confirm = useAdminConfirm();

  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(fetchAdminVideos());
  }, [dispatch]);

  const statusFiltered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const filterFn = useCallback((list, q) => {
    if (!q) return list;
    return list.filter((item) =>
      `${titleOf(item)} ${item.externalId} ${item.status}`.toLowerCase().includes(q),
    );
  }, []);

  const pager = useAdminPagination(statusFiltered, { filterFn });

  function setField(key, value) {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(empty);
    setDirty(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(item) {
    const tr = item.translations?.find((t) => t.locale === "es") || item.translations?.[0];
    setEditingId(item.id);
    setForm({
      externalId: item.externalId || "",
      title: tr?.title || "",
      description: tr?.description || "",
      displayOrder: String(item.displayOrder ?? 0),
      status: item.status || "DRAFT",
      durationSeconds:
        item.durationSeconds != null ? String(item.durationSeconds) : "",
      sourcePublishedAt: item.sourcePublishedAt
        ? String(item.sourcePublishedAt).slice(0, 10)
        : "",
    });
    setDirty(false);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(empty);
    setDirty(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = {
      provider: "YOUTUBE",
      externalId: form.externalId.trim(),
      displayOrder: Number(form.displayOrder) || 0,
      status: form.status,
      translations: [
        { locale: "es", title: form.title, description: form.description || null },
      ],
    };
    if (form.durationSeconds.trim()) {
      body.durationSeconds = Number(form.durationSeconds) || null;
    } else if (editingId) {
      body.durationSeconds = null;
    }
    if (form.sourcePublishedAt.trim()) {
      body.sourcePublishedAt = form.sourcePublishedAt.trim();
    } else if (editingId) {
      body.sourcePublishedAt = null;
    }

    const action = editingId
      ? await dispatch(updateVideo({ id: editingId, body }))
      : await dispatch(createVideo(body));
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "Error");
      return;
    }
    toast.push({
      type: "success",
      message: editingId ? "Video actualizado." : "Video creado.",
    });
    dispatch(fetchAdminVideos());
    closeModal();
  }

  async function onArchive(row) {
    const ok = await confirm.ask({
      title: "Archivar video",
      message: `¿Archivar «${titleOf(row)}»?`,
      confirmLabel: "Archivar",
    });
    if (!ok) return;
    const previousStatus = row.status || "DRAFT";
    const action = await dispatch(archiveVideo(row.id));
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
      message: "Video archivado.",
      undo: async () => {
        await dispatch(updateVideo({ id: row.id, body: { status: previousStatus } }));
        dispatch(fetchAdminVideos());
      },
    });
  }

  const columns = [
    {
      key: "title",
      label: "Video",
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--admin-text)]">{titleOf(row)}</p>
          <p className="font-mono text-xs text-[var(--admin-text-muted)]">{row.externalId}</p>
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
        title="Videos"
        subtitle="YouTube publicados en el sitio."
        actions={
          <AdminButton tamano="sm" onClick={openCreate}>
            + Nuevo video
          </AdminButton>
        }
      />

      <div className="mb-6">
        <AdminStatCard label="Total videos" value={items.length} />
      </div>

      <AdminToolbar
        search={
          <AdminSearch value={pager.query} onChange={pager.setQuery} placeholder="Buscar video…" />
        }
      >
        <AdminSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
        empty="Todavía no hay videos — creá el primero."
        emptyAction={
          <AdminButton tamano="sm" onClick={openCreate}>
            + Nuevo video
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
        title={editingId ? "Editar video" : "Nuevo video"}
        dirty={dirty}
        footer={
          <AdminModalActions
            formId="video-form"
            onCancel={closeModal}
            saving={saving}
            submitLabel="Guardar"
          />
        }
      >
        <form id="video-form" onSubmit={onSubmit}>
          <AdminSection title="YouTube">
            <AdminField
              label="ID del video"
              required
              span={2}
              hint="Lo que va después de v= en la URL."
            >
              <AdminInput
                required
                value={form.externalId}
                onChange={(e) => setField("externalId", e.target.value)}
                placeholder="dQw4w9WgXcQ"
              />
            </AdminField>
            <AdminField label="Título" required span={2}>
              <AdminInput
                required
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </AdminField>
            <AdminField label="Descripción" span={2}>
              <AdminTextarea
                rows={4}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </AdminField>
            <AdminField label="Duración (segundos)">
              <AdminInput
                type="number"
                min={1}
                value={form.durationSeconds}
                onChange={(e) => setField("durationSeconds", e.target.value)}
                placeholder="opcional"
              />
            </AdminField>
            <AdminField label="Publicado en origen">
              <AdminInput
                type="date"
                value={form.sourcePublishedAt}
                onChange={(e) => setField("sourcePublishedAt", e.target.value)}
              />
            </AdminField>
            <AdminField label="Orden">
              <AdminInput
                type="number"
                value={form.displayOrder}
                onChange={(e) => setField("displayOrder", e.target.value)}
              />
            </AdminField>
            <AdminField label="Estado">
              <AdminSelect
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="ARCHIVED">Archivado</option>
              </AdminSelect>
            </AdminField>
          </AdminSection>
          {error ? (
            <div className="py-3">
              <AdminAlert type="error">{error}</AdminAlert>
            </div>
          ) : null}
        </form>
      </AdminModal>
    </div>
  );
}
