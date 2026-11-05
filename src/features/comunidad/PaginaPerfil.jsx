import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { claveLista, fetchPosts, fetchUserPublic } from "../../redux/slices/communitySlice";
import { Boton } from "../../components/ui/Boton";
import { MensajeTienda } from "../../components/tienda/TiendaUI";
import { Avatar, BotonVerMas, SkeletonPublicacion, TarjetaPublicacion } from "../../components/comunidad/ComunidadUI";
import { BotonDenunciar } from "../../components/comunidad/Interaccion";
import { usePostsDeLista } from "../../hooks/useComunidad";
import { useMetaPagina } from "../../hooks/useMetaPagina";
import { formatFechaLarga, plural } from "../../utils/comunidad";

export function PaginaPerfil() {
  const { username } = useParams();
  const dispatch = useDispatch();
  const entry = useSelector((s) => s.community.usuarios[username]);
  const me = useSelector((s) => s.userAuth.user);
  const params = useMemo(() => ({ author: username }), [username]);
  const key = claveLista(params);
  const lista = useSelector((s) => s.community.listas[key]);
  const posts = usePostsDeLista(key);
  const perfil = entry?.item;

  useMetaPagina({
    title: perfil ? `${perfil.displayName} (@${perfil.username})` : "Perfil",
    description: perfil?.bio || "Perfil en la comunidad de Fiestas Religiosas.",
    image: perfil?.avatarUrl,
  });

  useEffect(() => {
    dispatch(fetchUserPublic(username));
    dispatch(fetchPosts({ params }));
  }, [dispatch, username, params]);

  if (!perfil && (!entry || entry.status === "loading")) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true">
        <span className="sr-only" role="status">Cargando perfil…</span>
        <div className="flex items-center gap-4">
          <div className="tienda-skeleton h-20 w-20 rounded-full" />
          <div className="tienda-skeleton h-8 w-48" />
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <MensajeTienda
          tono={entry?.error?.code === "NOT_FOUND" ? "info" : "error"}
          titulo={entry?.error?.code === "NOT_FOUND" ? "Este perfil no existe" : "No pudimos cargar el perfil"}
          texto={entry?.error?.code === "NOT_FOUND" ? "Puede que la cuenta se haya eliminado." : entry?.error?.message}
          accion={<Boton to="/comunidad">Ir a la comunidad</Boton>}
        />
      </div>
    );
  }

  const esMio = me?.username === perfil.username;
  return (
    <section>
      <div className="bg-papel px-4 pt-8 pb-6 md:pt-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar user={perfil} size="xl" />
          <div className="min-w-0 flex-1">
            <h1 className="titulo-seccion">{perfil.displayName}</h1>
            <p className="text-sm">
              @{perfil.username}
              {perfil.province ? ` · ${perfil.province.name}` : ""} · En la comunidad desde {formatFechaLarga(perfil.createdAt)}
            </p>
            {perfil.bio ? <p className="mt-2 max-w-2xl">{perfil.bio}</p> : null}
            <p className="mt-2 text-sm font-medium text-azul-petroleo">
              {plural(perfil.stats.posts, "publicación", "publicaciones")} · {plural(perfil.stats.likesReceived, "me gusta recibido", "me gusta recibidos")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {esMio ? (
              <Boton variante="secundario" tamano="sm" to="/comunidad/mi-cuenta">
                Editar perfil
              </Boton>
            ) : (
              <BotonDenunciar targetType="USER" targetId={perfil.id} />
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="subtitulo-seccion">Publicaciones</h2>
        <div className="mt-6">
          {!lista || lista.status === "loading" ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <SkeletonPublicacion key={i} />
              ))}
            </div>
          ) : lista.status === "failed" ? (
            <MensajeTienda tono="error" titulo="No pudimos cargar las publicaciones" texto={lista.error} />
          ) : posts.length === 0 ? (
            <MensajeTienda
              titulo={esMio ? "Todavía no publicaste nada" : `${perfil.displayName} todavía no publicó nada`}
              accion={esMio ? <Boton to="/comunidad/publicar">Contar mi primera fiesta</Boton> : null}
            />
          ) : (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.id}>
                    <TarjetaPublicacion post={p} />
                  </li>
                ))}
              </ul>
              <BotonVerMas hayMas={Boolean(lista.nextCursor)} cargando={lista.loadingMore} onClick={() => dispatch(fetchPosts({ params, append: true }))} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
