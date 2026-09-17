import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Boton } from "../../components/ui/Boton";
import {
  fetchAdminSocial,
  removeSocial,
  upsertSocial,
} from "../../redux/slices/socialSlice";
import {
  AdminAlert,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminSelect,
  AdminTable,
} from "../components/AdminForm";

const empty = { platform: "INSTAGRAM", url: "", displayOrder: "0" };

export function AdminSocialPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.social.adminItems);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminSocial());
  }, [dispatch]);

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
    setForm(empty);
    dispatch(fetchAdminSocial());
  }

  const columns = [
    {
      key: "platform",
      label: "Plataforma",
      render: (row) => <span className="font-medium text-azul-petroleo">{row.platform}</span>,
    },
    {
      key: "url",
      label: "URL",
      render: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noreferrer"
          className="text-celeste-cielo hover:underline"
        >
          {row.url}
        </a>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-naranja-libro"
            onClick={() => dispatch(removeSocial(row.id))}
          >
            Borrar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Redes sociales"
        subtitle="Enlaces públicos de Instagram, Facebook y YouTube."
      />
      <div className="grid gap-8 xl:grid-cols-2">
        <AdminTable columns={columns} rows={items} empty="No hay redes cargadas." />
        <form onSubmit={onSubmit}>
          <AdminPanel
            title="Guardar enlace"
            footer={
              <Boton type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Boton>
            }
          >
            <AdminSection title="Enlace">
              <AdminField label="Plataforma" required>
                <AdminSelect
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
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
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                />
              </AdminField>
              <AdminField label="URL" required span={2}>
                <AdminInput
                  required
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://instagram.com/..."
                />
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
