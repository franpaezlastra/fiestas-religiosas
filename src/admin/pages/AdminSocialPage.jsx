import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminSocial,
  removeSocial,
  upsertSocial,
} from "../../redux/slices/socialSlice";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
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

const empty = { platform: "INSTAGRAM", url: "", displayOrder: "0" };

export function AdminSocialPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.social.adminItems);
  const toast = useAdminToast();
  const confirm = useAdminConfirm();

  const [form, setForm] = useState(empty);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminSocial());
  }, [dispatch]);

  function setField(key, value) {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setForm(empty);
    setDirty(false);
    setError("");
    setModalOpen(true);
  }

  function openEdit(row) {
    setForm({
      platform: row.platform,
      url: row.url || "",
      displayOrder: String(row.displayOrder ?? 0),
    });
    setDirty(false);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(empty);
    setDirty(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const action = await dispatch(
      upsertSocial({
        platform: form.platform,
        url: form.url.trim(),
        displayOrder: Number(form.displayOrder) || 0,
      }),
    );
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "Error");
      return;
    }
    toast.push({ type: "success", message: "Enlace guardado." });
    closeModal();
    dispatch(fetchAdminSocial());
  }

  async function onDelete(row) {
    const ok = await confirm.ask({
      title: "Borrar enlace",
      message: `¿Borrar el enlace de ${row.platform}? Esta acción no se puede deshacer desde el toast (borrado real).`,
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
        <span className="font-medium text-[var(--admin-text)]">{row.platform}</span>
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
        subtitle="Enlaces públicos del sitio."
        actions={
          <AdminButton tamano="sm" onClick={openCreate}>
            + Nuevo enlace
          </AdminButton>
        }
      />

      <div className="mb-6">
        <AdminStatCard label="Enlaces cargados" value={items.length} />
      </div>

      <AdminTable
        columns={columns}
        rows={items}
        empty="Todavía no hay redes — cargá la primera."
        emptyAction={
          <AdminButton tamano="sm" onClick={openCreate}>
            + Nuevo enlace
          </AdminButton>
        }
      />

      <AdminModal
        open={modalOpen}
        onClose={closeModal}
        title="Guardar enlace"
        size="md"
        dirty={dirty}
        footer={
          <AdminModalActions
            formId="social-form"
            onCancel={closeModal}
            saving={saving}
            submitLabel="Guardar"
          />
        }
      >
        <form id="social-form" onSubmit={onSubmit}>
          <AdminSection title="Enlace">
            <AdminField label="Plataforma" required>
              <AdminSelect
                value={form.platform}
                onChange={(e) => setField("platform", e.target.value)}
              >
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="YOUTUBE">YouTube</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Orden">
              <AdminInput
                type="number"
                value={form.displayOrder}
                onChange={(e) => setField("displayOrder", e.target.value)}
              />
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
