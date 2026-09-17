import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Boton } from "../../components/ui/Boton";
import {
  archiveVideo,
  createVideo,
  fetchAdminVideos,
  updateVideo,
} from "../../redux/slices/videosSlice";
import {
  AdminAlert,
  AdminBadge,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminSelect,
  AdminTable,
  AdminTextarea,
} from "../components/AdminForm";

const empty = {
  externalId: "",
  title: "",
  description: "",
  displayOrder: "0",
  status: "DRAFT",
};

function titleOf(video) {
  return video.translations?.find((t) => t.locale === "es")?.title || video.externalId;
}

export function AdminVideosPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.videos.adminItems);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminVideos());
  }, [dispatch]);

  function load(item) {
    const tr = item.translations?.find((t) => t.locale === "es") || item.translations?.[0];
    setEditingId(item.id);
    setForm({
      externalId: item.externalId || "",
      title: tr?.title || "",
      description: tr?.description || "",
      displayOrder: String(item.displayOrder ?? 0),
      status: item.status || "DRAFT",
    });
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
    const action = editingId
      ? await dispatch(updateVideo({ id: editingId, body }))
      : await dispatch(createVideo(body));
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "Error");
      return;
    }
    setEditingId(null);
    setForm(empty);
    dispatch(fetchAdminVideos());
  }

  const columns = [
    {
      key: "title",
      label: "Video",
      render: (row) => (
        <div>
          <p className="font-medium text-azul-petroleo">{titleOf(row)}</p>
          <p className="font-mono text-xs text-texto/60">{row.externalId}</p>
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
        <div className="flex justify-end gap-3">
          <button type="button" className="text-sm text-celeste-cielo" onClick={() => load(row)}>
            Editar
          </button>
          <button
            type="button"
            className="text-sm text-naranja-libro"
            onClick={() => dispatch(archiveVideo(row.id))}
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
        title="Videos"
        subtitle="Videos de YouTube que se muestran en la sección pública Video."
      />
      <div className="grid gap-8 xl:grid-cols-2">
        <AdminTable columns={columns} rows={items} empty="No hay videos." />
        <form onSubmit={onSubmit}>
          <AdminPanel
            title={editingId ? "Editar video" : "Nuevo video"}
            footer={
              <Boton type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Boton>
            }
          >
            <AdminSection title="YouTube">
              <AdminField
                label="ID del video"
                required
                span={2}
                hint="Lo que va después de v= en la URL de YouTube."
              >
                <AdminInput
                  required
                  value={form.externalId}
                  onChange={(e) => setForm((f) => ({ ...f, externalId: e.target.value }))}
                  placeholder="dQw4w9WgXcQ"
                />
              </AdminField>
              <AdminField label="Título" required span={2}>
                <AdminInput
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Descripción" span={2}>
                <AdminTextarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Orden">
                <AdminInput
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Estado">
                <AdminSelect
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PUBLISHED">Publicado</option>
                </AdminSelect>
              </AdminField>
            </AdminSection>
            {error ? (
              <div className="py-4">
                <AdminAlert type="error">{error}</AdminAlert>
              </div>
            ) : null}
          </AdminPanel>
        </form>
      </div>
    </div>
  );
}
