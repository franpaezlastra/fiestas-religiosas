import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { Pendiente } from "../../components/ui/Pendiente";
import { Portadilla } from "../../components/ui/Portadilla";
import { fetchPublicVideos } from "../../redux/slices/videosSlice";

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
        {published.length === 0 ? (
          <>
            <Pendiente titulo="Pendiente — YouTube">
              Todavía no hay videos publicados en el backend. Cargalos desde el panel admin.
            </Pendiente>
            <div className="mt-6 aspect-video w-full border border-dashed border-azul-logo/40 bg-papel" />
          </>
        ) : (
          <div className="flex flex-col gap-8">
            {published.map((video) => {
              const title =
                video.translation?.title ||
                video.translations?.find((t) => t.locale === "es")?.title ||
                "Video";
              return (
                <div key={video.id}>
                  <h3 className="subtitulo-seccion">{title}</h3>
                  <div className="mt-4 aspect-video w-full overflow-hidden bg-papel">
                    <iframe
                      title={title}
                      src={`https://www.youtube.com/embed/${video.externalId}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
