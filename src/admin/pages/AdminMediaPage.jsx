import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Boton } from "../../components/ui/Boton";
import { fetchAdminMedia, removeMedia, uploadMedia } from "../../redux/slices/mediaSlice";
import { AdminAlert, AdminPageHeader } from "../components/AdminForm";

export function AdminMediaPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.media.items);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminMedia());
  }, [dispatch]);

  async function onUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    setError("");
    setMessage("");
    const action = await dispatch(uploadMedia(files));
    setBusy(false);
    e.target.value = "";
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "No se pudo subir. Configurá Cloudinary en el backend.");
      return;
    }
    setMessage(`${files.length} imagen(es) subida(s). Ya las podés asociar en Fiestas.`);
  }

  return (
    <div>
      <AdminPageHeader
        title="Imágenes"
        subtitle="Biblioteca de medios. Subí primero acá y después elegí la imagen primaria en cada fiesta."
        actions={
          <label className="inline-block">
            <span className="boton-sitio inline-flex cursor-pointer items-center bg-azul-petroleo px-4 py-2 text-sm text-blanco hover:bg-celeste-cielo">
              {busy ? "Subiendo…" : "Subir imágenes"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={onUpload}
            />
          </label>
        }
      />

      <div className="mb-6 space-y-2">
        {error ? <AdminAlert type="error">{error}</AdminAlert> : null}
        {message ? <AdminAlert type="success">{message}</AdminAlert> : null}
        <AdminAlert type="info">
          Máximo 5 archivos por carga y 15 MB por imagen. Sin Cloudinary configurado, la subida
          falla.
        </AdminAlert>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-azul-logo/25 bg-blanco px-6 py-16 text-center text-sm text-texto/70">
          Todavía no hay imágenes en la biblioteca.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <figure
              key={item.id}
              className="overflow-hidden border border-azul-logo/15 bg-blanco shadow-[0_8px_20px_rgb(3_62_96/0.05)]"
            >
              {item.url ? (
                <img src={item.url} alt="" className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-papel text-xs">
                  Sin URL
                </div>
              )}
              <figcaption className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-azul-petroleo">
                  {item.originalFilename}
                </p>
                <p className="truncate font-mono text-[10px] text-texto/50">{item.id}</p>
                <Boton tamano="sm" variante="secundario" onClick={() => dispatch(removeMedia(item.id))}>
                  Borrar
                </Boton>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
