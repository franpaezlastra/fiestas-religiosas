import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { Pendiente } from "../../components/ui/Pendiente";
import { Portadilla } from "../../components/ui/Portadilla";
import { SectionLoader } from "../../components/ui/SectionLoader";
import { fetchPublicVideos } from "../../redux/slices/videosSlice";
import { isPublicLoading } from "../../utils/preload";

const selectPublishedVideos = createSelector(
  [(s) => s.videos.publicItems],
  (videos) =>
    (Array.isArray(videos) ? videos : []).filter(
      (v) => v.status === "PUBLISHED" || v.externalId,
    ),
);

export function SeccionVideo() {
  const dispatch = useDispatch();
  const published = useSelector(selectPublishedVideos);
  const status = useSelector((s) => s.videos.status);
  const loading = isPublicLoading(status);

  useEffect(() => {
    dispatch(fetchPublicVideos());
  }, [dispatch]);

  return (
    <section>
      <Portadilla
        id="video"
        titulo="Video resumen de las fiestas"
        kicker="Festival summary video"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {loading ? (
          <SectionLoader
            texto="Cargando video…"
            hint="Traemos los videos publicados desde el servidor."
          />
        ) : published.length === 0 ? (
          <>
            <Pendiente titulo="Pendiente — YouTube">
              Todavía no hay videos publicados en el backend. Cargalos desde el panel admin.
            </Pendiente>
            <div className="mt-6 aspect-video w-full border border-dashed border-azul-logo/40 bg-papel" />
          </>
        ) : (
          <div className="flex flex-col">
            {published.map((video, index) => {
              const title =
                video.translation?.title ||
                video.translations?.find((t) => t.locale === "es")?.title ||
                "Video";
              const description =
                video.translation?.description ||
                video.translations?.find((t) => t.locale === "es")?.description ||
                null;
              return (
                <article key={video.id} className="reveal-scroll">
                  {index > 0 ? (
                    <div
                      className="my-12 flex items-center gap-4 md:my-16"
                      aria-hidden
                    >
                      <span className="h-px flex-1 bg-azul-logo/25" />
                      <span className="font-display text-[10px] uppercase tracking-[0.2em] text-azul-logo/50">
                        ·
                      </span>
                      <span className="h-px flex-1 bg-azul-logo/25" />
                    </div>
                  ) : null}
                  <h3 className="subtitulo-seccion">{title}</h3>
                  {description ? (
                    <p className="mt-3 font-light leading-relaxed text-azul-petroleo/80">
                      {description}
                    </p>
                  ) : null}
                  <div className="mt-5 aspect-video w-full overflow-hidden bg-papel shadow-[0_1px_0_rgb(65_93_130/0.12)]">
                    <iframe
                      title={title}
                      src={`https://www.youtube.com/embed/${video.externalId}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
