import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminSocial,
  removeSocial,
  upsertSocial,
} from "../../redux/slices/socialSlice";
import { socialService } from "../../services";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
import { AdminSortableList, nextDisplayOrder } from "../components/AdminSortableList";
import {
  AdminAlert,
  AdminField,
  AdminIconButton,
  AdminInput,
  AdminPageHeader,
  AdminSection,
  AdminSelect,
  AdminStatCard,
  AdminTable,
} from "../components/AdminForm";

const empty = { platform: "INSTAGRAM", url: "" };

const PLATFORM_LABEL = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  YOUTUBE: "YouTube",
};

export function AdminSocialPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.social.adminItems);
  const adminStatus = useSelector((state) => state.social.adminStatus);
  const loadError = useSelector((state) => state.social.error);
  const toast = useAdminToast();
  const confirm = useAdminConfirm();

  const [form, setForm] = useState(empty);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [modoOrdenar, setModoOrdenar] = useState(false);
  const [reorderBusy, setReorderBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminSocial());
  }, [dispatch]);

  const sorted = useMemo(
    () =>
      [...(Array.isArray(items) ? items : [])].sort(
        (a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999),
      ),
    [items],
  );

  const loading = adminStatus === "loading" || adminStatus === "idle";

  function setField(key, value) {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditingPlatform(null);
    setForm(empty);
    setDirty(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingPlatform(row.platform);
    setForm({
      platform: row.platform,
      url: row.url || "",
    });
    setDirty(false);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPlatform(null);
    setForm(empty);
    setDirty(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      platform: form.platform,
      url: form.url.trim(),
    };
    if (!editingPlatform) {
      payload.displayOrder = nextDisplayOrder(sorted);
    }
    const action = await dispatch(upsertSocial(payload));
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "Error");
      return;
    }
    toast.push({ type: "success", message: "Enlace guardado." });
    closeModal();
    dispatch(fetchAdminSocial());
  }

  async function onReorder(ids, reordered) {
    setReorderBusy(true);
    try {
      await socialService.reorder(ids, reordered);
      toast.push({ type: "success", message: "Orden de redes actualizado." });
      dispatch(fetchAdminSocial());
    } catch (err) {
      toast.push({
        type: "error",
        message: err.message || "No se pudo reordenar",
      });
    } finally {
      setReorderBusy(false);
    }
  }

  async function onDelete(row) {
    const ok = await confirm.ask({
      title: "Borrar enlace",
      message: `¿Borrar el enlace de ${PLATFORM_LABEL[row.platform] || row.platform}?`,
      confirmLabel: "Borrar",
    });
    if (!ok) return;
    const action = await dispatch(removeSocial(row.id));
    if (action.meta.requestStatus === "rejected") {
      toast.push({
        type: "error",
        message: action.payload?.message || "No se pudo borrar",
      });
      return;
    }
    toast.push({ type: "success", message: "Enlace eliminado." });
  }

  const columns = [
    {
      key: "platform",
      label: "Plataforma",
      render: (row) => (
        <span className="font-medium text-[var(--admin-text)]">
          {PLATFORM_LABEL[row.platform] || row.platform}
        </span>
      ),
    },
    {
      key: "url",
      label: "URL",
      render: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--admin-accent)] hover:underline"
        >
          {row.url}
        </a>
      ),
    },
    {
      key: "order",
      label: "Orden",
      render: (row) => row.displayOrder ?? 0,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-1">
          <AdminIconButton label="Editar" onClick={() => openEdit(row)}>
            ✎
          </AdminIconButton>
          <AdminIconButton label="Borrar" danger onClick={() => onDelete(row)}>
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
        title="Redes sociales"
        subtitle="Enlaces públicos del sitio. El orden se define arrastrando."
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton
              tamano="sm"
              variante="secondary"
              onClick={() => setModoOrdenar((v) => !v)}
              disabled={!sorted.length}
            >
              {modoOrdenar ? "Salir" : "Reordenar"}
            </AdminButton>
            {!modoOrdenar ? (
              <AdminButton tamano="sm" onClick={openCreate}>
                + Nuevo enlace
              </AdminButton>
            ) : null}
          </div>
        }
      />

      <div className="mb-6">
        <AdminStatCard label="Enlaces cargados" value={sorted.length} />
      </div>

      {loadError && adminStatus === "failed" ? (
        <div className="mb-4">
          <AdminAlert type="error">
            No se pudieron cargar las redes: {loadError}.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => dispatch(fetchAdminSocial())}
            >
              Reintentar
            </button>
          </AdminAlert>
        </div>
      ) : null}

      {loading && !sorted.length ? (
        <p className="mb-6 text-sm text-[var(--admin-text-muted)]">Cargando enlaces…</p>
      ) : null}

      {modoOrdenar ? (
        <div className="mb-6">
          <p className="mb-3 text-sm text-[var(--admin-text-muted)]">
            Arrastrá para cambiar el orden. Se guarda al soltar.
          </p>
          <AdminSortableList
            items={sorted}
            busy={reorderBusy}
            empty="No hay redes para ordenar."
            onReorder={onReorder}
            renderItem={(item) => (
              <div>
                <p className="font-medium text-[var(--admin-text)]">
                  {PLATFORM_LABEL[item.platform] || item.platform}
                </p>
                <p className="truncate text-xs text-[var(--admin-text-muted)]">{item.url}</p>
              </div>
            )}
          />
        </div>
      ) : (
        <AdminTable
          columns={columns}
          rows={sorted}
          empty="Todavía no hay redes — cargá la primera. No vienen precargadas: hay que crearlas acá."
          emptyAction={
            <AdminButton tamano="sm" onClick={openCreate}>
              + Nuevo enlace
            </AdminButton>
          }
        />
      )}

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title={editingPlatform ? "Editar enlace" : "Nuevo enlace"}
        size="md"
        dirty={dirty}
        footer={
          <AdminModalActions
            formId="social-form"
            onCancel={closeModal}
            saving={saving}
            submitLabel="Guardar"
            dirty={dirty}
          />
        }
      >
        <form id="social-form" onSubmit={onSubmit}>
          <AdminSection title="Enlace">
            <AdminField label="Plataforma" required>
              <AdminSelect
                value={form.platform}
                onChange={(e) => setField("platform", e.target.value)}
                disabled={Boolean(editingPlatform)}
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="YOUTUBE">YouTube</option>
              </AdminSelect>
            </AdminField>
            <AdminField
              label="Orden"
              hint="Se asigna solo al crear. Cambialo con Reordenar en el listado."
            >
              <p className="py-2 text-sm text-[var(--admin-text)]">
                {editingPlatform
                  ? sorted.find((i) => i.platform === editingPlatform)?.displayOrder ?? "—"
                  : nextDisplayOrder(sorted)}
              </p>
            </AdminField>
            <AdminField label="URL" required span={2}>
              <AdminInput
                required
                type="url"
                value={form.url}
                onChange={(e) => setField("url", e.target.value)}
                placeholder="https://instagram.com/..."
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
    </div>
  );
}
