import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createPost, fetchPost, selectPostPorSlug, updatePost } from "../../redux/slices/communitySlice";
import { Boton } from "../../components/ui/Boton";
import { Campo, EncabezadoTienda, MensajeTienda } from "../../components/tienda/TiendaUI";
import { ContadorCaracteres } from "../../components/comunidad/ComunidadUI";
import { CargadorImagenes, SelectorFiesta, SelectorSantos } from "../../components/comunidad/Formulario";
import { useOpcionesComunidad } from "../../hooks/useComunidad";
import { useMetaPagina } from "../../hooks/useMetaPagina";
import {
  BORRADOR_KEY,
  LIMITES,
  erroresDeCampos,
  formatHace,
  mensajeError,
  provinciaSlugDeNombre,
} from "../../utils/comunidad";

const VACIO = { title: "", body: "", celebration: null, provinceSlug: "", personSlugs: [], yearAttended: "" };

function leerBorrador() {
  try {
    const raw = localStorage.getItem(BORRADOR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarBorrador(data) {
  try {
    localStorage.setItem(BORRADOR_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function borrarBorrador() {
  try {
    localStorage.removeItem(BORRADOR_KEY);
  } catch {
    /* ignore */
  }
}

function imagenesDelPost(post) {
  return (post.images || []).map((img) => ({
    key: img.id,
    uploadId: img.id,
    url: img.url,
    alt: img.alt || "",
    estado: "listo",
    progreso: 1,
  }));
}

export function PaginaPublicar() {
  const { slug } = useParams();
  const editando = Boolean(slug);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = useSelector((s) => s.userAuth.user);
  const post = useSelector((s) => (slug ? selectPostPorSlug(s, slug) : null));
  const entry = useSelector((s) => (slug ? s.community.bySlug[slug] : null));
  const { fiestas, provincias, santos } = useOpcionesComunidad();

  const [form, setForm] = useState(VACIO);
  const [imagenes, setImagenes] = useState([]);
  const [portada, setPortada] = useState(null);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enRevision, setEnRevision] = useState(null);
  const [borradorDe, setBorradorDe] = useState(null);
  const cargado = useRef(false);

  useMetaPagina({ title: editando ? "Editar publicación" : "Publicar" });

  /* Edición: traer la publicación completa */
  useEffect(() => {
    if (editando) dispatch(fetchPost(slug));
  }, [dispatch, editando, slug]);

  /* Precarga: el post (edición) o el borrador / ?fiesta= (nueva) */
  useEffect(() => {
    if (cargado.current) return;
    if (editando) {
      if (!post?.full) return;
      cargado.current = true;
      setForm({
        title: post.title,
        body: post.body,
        celebration: post.celebration ? { id: post.celebration.id, slug: post.celebration.slug, nombre: post.celebration.name } : null,
        provinceSlug: post.province?.slug || "",
        personSlugs: (post.people || []).map((p) => p.slug),
        yearAttended: post.yearAttended ? String(post.yearAttended) : "",
      });
      setImagenes(imagenesDelPost(post));
      setPortada(post.coverUploadId || null);
      return;
    }
    const borrador = leerBorrador();
    const slugFiesta = params.get("fiesta");
    if (borrador) {
      cargado.current = true;
      setForm({ ...VACIO, ...borrador.form });
      setImagenes(borrador.imagenes || []);
      setPortada(borrador.portada || null);
      setBorradorDe(borrador.savedAt);
    } else if (slugFiesta) {
      if (!fiestas.length) return;
      cargado.current = true;
      const f = fiestas.find((x) => x.slug === slugFiesta);
      if (f) setForm((v) => ({ ...v, celebration: f, provinceSlug: f.provinciaSlug || provinciaSlugDeNombre(f.provincia) || "" }));
    } else {
      cargado.current = true;
    }
  }, [editando, post, params, fiestas]);

  /* Borrador automático (solo publicaciones nuevas) */
  useEffect(() => {
    if (editando || !cargado.current || enRevision) return undefined;
    const vacio = !form.title && !form.body && !imagenes.length;
    const t = window.setTimeout(() => {
      if (vacio) return;
      guardarBorrador({
        form,
        /* Las URLs data: (simulación) no se guardan: pesan demasiado para localStorage */
        imagenes: imagenes
          .filter((i) => i.estado === "listo")
          .map(({ key, uploadId, url, alt }) => ({ key, uploadId, url: url?.startsWith("data:") ? null : url, alt, estado: "listo", progreso: 1 })),
        portada,
        savedAt: new Date().toISOString(),
      });
    }, 600);
    return () => window.clearTimeout(t);
  }, [form, imagenes, portada, editando, enRevision]);

  if (editando && !post?.full) {
    if (entry?.status === "failed") {
      return (
        <div className="mx-auto max-w-3xl px-4 py-12">
          <MensajeTienda tono="error" titulo="No pudimos cargar la publicación" texto={entry.error?.message} accion={<Boton to="/comunidad/mi-cuenta#mis-publicaciones">Mis publicaciones</Boton>} />
        </div>
      );
    }
    return <p className="mx-auto max-w-3xl px-4 py-12" role="status">Cargando publicación…</p>;
  }

  if (editando && !post.isMine) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <MensajeTienda tono="error" titulo="Solo el autor puede editar esta publicación" accion={<Boton to={`/comunidad/p/${slug}`}>Volver</Boton>} />
      </div>
    );
  }

  if (enRevision) {
    return (
      <section>
        <EncabezadoTienda titulo="¡Gracias por compartir!" kicker="Comunidad" />
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10">
          <p className="border border-naranja-libro/40 bg-[#fffaeb] p-4" role="status">
            Tu publicación está en revisión. Te avisamos por email cuando se publique.
          </p>
          <p className="text-sm">
            Revisamos las publicaciones de las cuentas nuevas para cuidar la comunidad. Después de algunas publicaciones aprobadas, las tuyas salen al instante.
          </p>
          <div className="flex flex-wrap gap-2">
            <Boton to={`/comunidad/p/${enRevision}`}>Ver cómo quedó</Boton>
            <Boton variante="secundario" to="/comunidad/mi-cuenta#mis-publicaciones">
              Mis publicaciones
            </Boton>
          </div>
        </div>
      </section>
    );
  }

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function elegirFiesta(f) {
    setForm((v) => ({
      ...v,
      celebration: f,
      provinceSlug: f ? f.provinciaSlug || provinciaSlugDeNombre(f.provincia) || v.provinceSlug : v.provinceSlug,
    }));
  }

  function empezarDeCero() {
    borrarBorrador();
    setForm(VACIO);
    setImagenes([]);
    setPortada(null);
    setBorradorDe(null);
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    const errs = {};
    const title = form.title.trim();
    const body = form.body.trim();
    if (title.length < LIMITES.titleMin || title.length > LIMITES.titleMax) {
      errs.title = `El título tiene que tener entre ${LIMITES.titleMin} y ${LIMITES.titleMax} caracteres.`;
    }
    if (body.length < LIMITES.bodyMin || body.length > LIMITES.bodyMax) {
      errs.body = `El texto tiene que tener entre ${LIMITES.bodyMin} y ${LIMITES.bodyMax.toLocaleString("es-AR")} caracteres.`;
    }
    const anio = form.yearAttended ? Number(form.yearAttended) : null;
    if (anio != null && (!Number.isInteger(anio) || anio < 1900 || anio > new Date().getFullYear())) {
      errs.yearAttended = `Ingresá un año entre 1900 y ${new Date().getFullYear()}.`;
    }
    const imgErr = {};
    if (imagenes.some((i) => i.estado === "comprimiendo" || i.estado === "subiendo")) imgErr.general = "Esperá a que terminen de subir las fotos.";
    if (imagenes.some((i) => i.estado === "error")) imgErr.general = "Quitá las fotos que no se pudieron subir.";
    imagenes.forEach((i) => {
      if (i.estado === "listo" && !i.alt.trim()) imgErr[i.key] = "Describí la foto en pocas palabras.";
    });
    if (Object.keys(imgErr).length) errs.imagenes = imgErr;
    setErrores(errs);
    if (Object.keys(errs).length) {
      window.setTimeout(() => document.querySelector("[aria-invalid='true'], .campo-error")?.scrollIntoView({ block: "center" }), 0);
      window.setTimeout(() => document.querySelector("[aria-invalid='true']")?.focus(), 0);
      return;
    }

    const listas = imagenes.filter((i) => i.estado === "listo");
    const cover = listas.find((i) => i.key === portada) || listas[0];
    const payload = {
      title,
      body,
      celebrationId: form.celebration?.id || null,
      provinceSlug: form.provinceSlug || null,
      personSlugs: form.personSlugs,
      yearAttended: anio,
      images: listas.map((i) => ({ uploadId: i.uploadId, alt: i.alt.trim() })),
      coverUploadId: cover?.uploadId || null,
    };

    setEnviando(true);
    try {
      const res = editando
        ? await dispatch(updatePost({ id: post.id, body: payload })).unwrap()
        : await dispatch(createPost(payload)).unwrap();
      if (!editando) borrarBorrador();
      if (res.status === "PENDING") setEnRevision(res.slug);
      else navigate(`/comunidad/p/${res.slug}`, { replace: true, state: { publicada: !editando } });
    } catch (err) {
      setEnviando(false);
      if (err.code === "INVALID_REQUEST") setErrores(erroresDeCampos(err));
      setError(
        err.code === "EMAIL_NOT_VERIFIED" ? (
          <>
            Confirmá tu email para poder publicar. <Link to="/comunidad/verificar" className="underline">Ver cómo</Link>. Tu borrador queda guardado.
          </>
        ) : (
          mensajeError(err)
        ),
      );
    }
  }

  const sinVerificar = user && !user.emailVerified;

  return (
    <section>
      <EncabezadoTienda titulo={editando ? "Editar publicación" : "Contá tu experiencia"} kicker="Comunidad">
        <p className="mt-2 max-w-2xl text-sm">
          Antes de publicar, leé las <Link to="/comunidad/normas" className="text-celeste-cielo underline">normas de la comunidad</Link>: respeto a todas las creencias, solo fotos propias y nada de datos personales de otras personas.
        </p>
      </EncabezadoTienda>
      <form onSubmit={enviar} noValidate className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        {sinVerificar ? (
          <p className="border border-naranja-libro/40 bg-[#fffaeb] p-4 text-sm" role="status">
            Confirmá tu email para poder subir fotos y publicar. Mientras tanto podés escribir: guardamos el borrador.
          </p>
        ) : null}
        {borradorDe && !editando ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border border-azul-logo/20 bg-papel px-4 py-3 text-sm" role="status">
            <span>Recuperamos el borrador que dejaste {formatHace(borradorDe)}.</span>
            <button type="button" className="text-celeste-cielo underline" onClick={empezarDeCero}>
              Empezar de cero
            </button>
          </div>
        ) : null}
        {editando && post.status === "PUBLISHED" && !user?.canPublishDirectly ? (
          <p className="border border-azul-logo/20 bg-papel p-4 text-sm">Al guardar, la publicación vuelve a revisión antes de mostrarse otra vez.</p>
        ) : null}

        <div>
          <Campo id="title" label="Título" required maxLength={LIMITES.titleMax + 20} value={form.title} onChange={(e) => set("title", e.target.value)} error={errores.title} aria-describedby={`title-contador${errores.title ? " title-error" : ""}`} />
          <ContadorCaracteres id="title-contador" actual={form.title.trim().length} max={LIMITES.titleMax} min={LIMITES.titleMin} />
        </div>

        <div>
          <Campo
            id="body"
            as="textarea"
            rows={10}
            label="Tu relato"
            required
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            error={errores.body}
            hint="Contá cómo fue, qué te emocionó, consejos para quien vaya. Separá los párrafos con una línea en blanco."
            aria-describedby={`body-hint body-contador${errores.body ? " body-error" : ""}`}
          />
          <ContadorCaracteres id="body-contador" actual={form.body.trim().length} max={LIMITES.bodyMax} min={LIMITES.bodyMin} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SelectorFiesta fiestas={fiestas} value={form.celebration} onChange={elegirFiesta} />
          </div>
          <Campo id="provinceSlug" as="select" label="Provincia" value={form.provinceSlug} onChange={(e) => set("provinceSlug", e.target.value)}>
            <option value="">Sin provincia</option>
            {provincias.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </Campo>
          <Campo
            id="yearAttended"
            type="number"
            inputMode="numeric"
            label="Año en que fuiste"
            min={1900}
            max={new Date().getFullYear()}
            placeholder={String(new Date().getFullYear())}
            value={form.yearAttended}
            onChange={(e) => set("yearAttended", e.target.value)}
            error={errores.yearAttended}
          />
          <div className="sm:col-span-2">
            <SelectorSantos santos={santos} value={form.personSlugs} onChange={(v) => set("personSlugs", v)} />
          </div>
        </div>

        <CargadorImagenes
          imagenes={imagenes}
          setImagenes={setImagenes}
          portada={portada}
          setPortada={setPortada}
          deshabilitado={sinVerificar}
          errores={errores.imagenes}
        />

        {error ? (
          <p className="border border-[#b42318]/30 bg-[#fef3f2] px-4 py-3 text-sm text-[#b42318]" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Boton type="submit" disabled={enviando} className="disabled:opacity-60">
            {enviando ? "Guardando…" : editando ? "Guardar cambios" : user?.canPublishDirectly ? "Publicar" : "Enviar a revisión"}
          </Boton>
          <Boton variante="secundario" to={editando ? `/comunidad/p/${slug}` : "/comunidad"}>
            Cancelar
          </Boton>
        </div>
        {!editando && !user?.canPublishDirectly ? (
          <p className="text-xs">Las publicaciones de cuentas nuevas se revisan antes de mostrarse. Suele tardar menos de un día.</p>
        ) : null}
      </form>
    </section>
  );
}
