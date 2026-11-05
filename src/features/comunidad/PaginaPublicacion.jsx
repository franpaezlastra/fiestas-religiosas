import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { deletePost, fetchPost, selectPostPorSlug } from "../../redux/slices/communitySlice";
import { Boton } from "../../components/ui/Boton";
import { MensajeTienda } from "../../components/tienda/TiendaUI";
import {
  Avatar,
  BotonMeGusta,
  ChipFiltro,
  Dialogo,
  EstadoPublicacion,
  TextoPlano,
} from "../../components/comunidad/ComunidadUI";
import { BotonDenunciar, Comentarios, LightboxComunidad } from "../../components/comunidad/Interaccion";
import { useMetaPagina } from "../../hooks/useMetaPagina";
import { formatFechaLarga, formatHace, mensajeError } from "../../utils/comunidad";

export function PaginaPublicacion() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const entry = useSelector((s) => s.community.bySlug[slug]);
  const post = useSelector((s) => selectPostPorSlug(s, slug));
  const user = useSelector((s) => s.userAuth.user);
  const [lightbox, setLightbox] = useState(null);
  const [borrar, setBorrar] = useState(false);
  const [error, setError] = useState(null);

  useMetaPagina({
    title: post?.title || "Publicación",
    description: post?.excerpt,
    image: post?.cover?.url,
  });

  useEffect(() => {
    dispatch(fetchPost(slug));
  }, [dispatch, slug, user?.id]);

  const completo = post?.full;

  if (!completo && (!entry || entry.status === "loading")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10" aria-busy="true">
        <span className="sr-only" role="status">
          Cargando publicación…
        </span>
        <div className="tienda-skeleton h-10 w-4/5" />
        <div className="tienda-skeleton mt-4 h-5 w-1/3" />
        <div className="tienda-skeleton mt-6 aspect-[16/9] w-full" />
        <div className="tienda-skeleton mt-6 h-32 w-full" />
      </div>
    );
  }

  if (!completo) {
    const noExiste = entry?.error?.code === "NOT_FOUND";
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <MensajeTienda
          tono={noExiste ? "info" : "error"}
          titulo={noExiste ? "Esta publicación no está disponible" : "No pudimos cargar la publicación"}
          texto={noExiste ? "Puede que se haya borrado o que todavía esté en revisión." : entry?.error?.message}
          accion={
            noExiste ? (
              <Boton to="/comunidad">Ir a la comunidad</Boton>
            ) : (
              <Boton onClick={() => dispatch(fetchPost(slug))}>Reintentar</Boton>
            )
          }
        />
      </div>
    );
  }

  async function confirmarBorrado() {
    try {
      await dispatch(deletePost(post.id)).unwrap();
      navigate("/comunidad/mi-cuenta#mis-publicaciones", { replace: true });
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  const imagenes = post.images || [];
  return (
    <article className="pb-12">
      <header className="bg-papel px-4 pt-8 pb-6 md:pt-12">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Migas de pan" className="mb-4 text-sm">
            <Link to="/comunidad" className="text-celeste-cielo hover:text-azul-petroleo">
              Comunidad
            </Link>
            {post.celebration ? (
              <>
                {" / "}
                <Link to={`/comunidad?fiesta=${post.celebration.slug}`} className="text-celeste-cielo hover:text-azul-petroleo">
                  {post.celebration.name}
                </Link>
              </>
            ) : null}
          </nav>
          {post.status !== "PUBLISHED" ? (
            <div className="mb-4 border border-naranja-libro/40 bg-[#fffaeb] p-4 text-sm" role="status">
              <EstadoPublicacion status={post.status} />
              <p className="mt-2">
                {post.status === "PENDING"
                  ? "Tu publicación está en revisión. Solo vos la ves hasta que la aprobemos; te avisamos por email."
                  : "Tu publicación no fue aprobada. Podés editarla y se vuelve a revisar."}
              </p>
              {post.moderationNote ? (
                <p className="mt-2">
                  <strong>Motivo:</strong> {post.moderationNote}
                </p>
              ) : null}
            </div>
          ) : null}
          <h1 className="titulo-seccion">{post.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {post.author ? (
              <Link to={`/comunidad/u/${post.author.username}`} className="flex items-center gap-2 hover:text-celeste-cielo">
                <Avatar user={post.author} size="md" />
                <span className="font-medium text-azul-petroleo">{post.author.displayName}</span>
              </Link>
            ) : (
              <span>Cuenta eliminada</span>
            )}
            {post.publishedAt ? (
              <span>
                · <time dateTime={post.publishedAt} title={formatFechaLarga(post.publishedAt)}>{formatHace(post.publishedAt)}</time>
              </span>
            ) : null}
            {post.editedAt ? <span>· editada</span> : null}
            {post.yearAttended ? <span>· Fue en {post.yearAttended}</span> : null}
          </div>
          {post.celebration || post.province || post.people?.length ? (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Etiquetas">
              {post.celebration ? (
                <li>
                  <ChipFiltro to={`/comunidad?fiesta=${post.celebration.slug}`}>{post.celebration.name}</ChipFiltro>
                </li>
              ) : null}
              {post.province ? (
                <li>
                  <ChipFiltro to={`/comunidad?provincia=${post.province.slug}`}>{post.province.name}</ChipFiltro>
                </li>
              ) : null}
              {post.people?.map((p) => (
                <li key={p.slug}>
                  <ChipFiltro to={`/comunidad?santo=${p.slug}`}>{p.displayName}</ChipFiltro>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {imagenes.length ? (
          <div className={`mt-6 grid gap-2 ${imagenes.length > 1 ? "grid-cols-2 sm:grid-cols-3" : ""}`}>
            {imagenes.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightbox(i)}
                className={`foto-libro block ${imagenes.length === 1 ? "aspect-[16/10]" : i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"}`}
                aria-label={`Ampliar imagen ${i + 1} de ${imagenes.length}${img.alt ? `: ${img.alt}` : ""}`}
              >
                <img src={img.url} alt="" loading={i === 0 ? "eager" : "lazy"} />
              </button>
            ))}
          </div>
        ) : null}

        <TextoPlano texto={post.body} className="mt-8 text-lg leading-relaxed" />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-azul-logo/15 py-4">
          <BotonMeGusta post={post} />
          <div className="flex flex-wrap items-center gap-3">
            {post.isMine ? (
              <>
                <Boton variante="secundario" tamano="sm" to={`/comunidad/p/${post.slug}/editar`}>
                  Editar
                </Boton>
                <Boton variante="secundario" tamano="sm" onClick={() => setBorrar(true)}>
                  Borrar
                </Boton>
              </>
            ) : (
              <BotonDenunciar targetType="POST" targetId={post.id} />
            )}
          </div>
        </div>

        {location.state?.publicada ? (
          <p className="mt-6 border border-[#166534]/30 bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]" role="status">
            ¡Listo! Tu publicación ya está en la comunidad.
          </p>
        ) : null}

        <div className="mt-8">
          <Comentarios post={post} />
        </div>
      </div>

      <LightboxComunidad imagenes={imagenes} indice={lightbox} onClose={() => setLightbox(null)} titulo={post.title} />
      <Dialogo open={borrar} onClose={() => setBorrar(false)} titulo="Borrar publicación">
        <p>Se borran también sus fotos, me gusta y comentarios. No se puede deshacer.</p>
        {error ? <p className="campo-error" role="alert">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Boton onClick={confirmarBorrado} className="!bg-[#b42318] hover:!bg-[#8f1c13]">
            Sí, borrar
          </Boton>
          <Boton variante="secundario" onClick={() => setBorrar(false)} data-autofocus>
            Cancelar
          </Boton>
        </div>
      </Dialogo>
    </article>
  );
}
