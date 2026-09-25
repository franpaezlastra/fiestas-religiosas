import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Portadilla } from "../../components/ui/Portadilla";
import { SectionLoader } from "../../components/ui/SectionLoader";
import { SoftImage } from "../../components/ui/SoftImage";
import { fetchPublicPeople } from "../../redux/slices/peopleSlice";
import { selectSantosForUi } from "../../utils/peopleAdapter";
import { isPublicLoading, preloadUrls } from "../../utils/preload";

const SANTOS_IMGS = [
  "/images/santos-grupo-removebg-preview.png",
  "/images/mapa-santos.png",
];

export function SeccionSantos() {
  const dispatch = useDispatch();
  const publicItems = useSelector((s) => s.people.publicItems);
  const fromHoliness = useSelector((s) => s.people.fromHoliness);
  const status = useSelector((s) => s.people.status);
  const [imgsListas, setImgsListas] = useState(false);
  const santos = useMemo(
    () => selectSantosForUi(publicItems, { fromHoliness }),
    [publicItems, fromHoliness],
  );

  const loadingPeople = isPublicLoading(status);
  const loading = loadingPeople || !imgsListas;

  useEffect(() => {
    dispatch(fetchPublicPeople());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    setImgsListas(false);
    preloadUrls(SANTOS_IMGS).then(() => {
      if (!cancelled) setImgsListas(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <Portadilla id="santos" titulo="Santos y beatos" kicker="Saints and blesseds in Argentina" />
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        {loading ? (
          <SectionLoader
            texto="Cargando santos…"
            hint="Preparando fichas e ilustraciones."
          />
        ) : (
          <>
            <figure>
              <SoftImage
                src={SANTOS_IMGS[0]}
                alt="Retratos de santos y beatos en Argentina, ilustración del folleto"
                eager
                className="mx-auto w-full"
              />
              <figcaption className="mt-3 text-sm">
                Santos y beatos en Argentina. Los números coinciden con el mapa y las fichas.
                <span className="caption-en block">
                  Saints and blesseds in Argentina. Numbers match the map and the profiles.
                </span>
              </figcaption>
            </figure>

            <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.35fr)]">
              <aside className="lg:sticky lg:top-24">
                <SoftImage
                  src={SANTOS_IMGS[1]}
                  alt="Mapa de Argentina con la ubicación numerada de santos y beatos"
                  eager
                  className="mx-auto w-full max-w-xs lg:max-w-none"
                />
                <p className="mt-3 text-center text-sm">
                  Mapa de referencia. Cada número señala una ficha.
                  <span className="caption-en block">
                    Reference map. Each number matches a profile.
                  </span>
                </p>
              </aside>

              <ol>
                {santos.map((s) => (
                  <li
                    key={s.apiId || s.id}
                    className="reveal-scroll mb-7 border-b border-azul-logo/15 pb-6 last:mb-0 last:border-b-0"
                  >
                    <p className="font-medium text-azul-petroleo">
                      <span
                        className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                          s.categoria === "santo"
                            ? "bg-azul-petroleo text-blanco"
                            : s.categoria === "siervo"
                              ? "border border-dashed border-azul-petroleo text-azul-petroleo"
                              : "bg-[#c4a574] text-blanco"
                        }`}
                      >
                        {s.id}
                      </span>
                      {s.nombre} <span className="font-light">({s.anios})</span>
                    </p>
                    <p className="mt-2 text-sm font-light leading-relaxed">{s.bio}</p>
                  </li>
                ))}
              </ol>
            </div>

            <p className="mt-12 max-w-3xl text-sm font-light leading-relaxed">
              En Argentina a julio del 2026, según el Delegado para las Causas de los Santos de la CEA,
              Mons. Mauricio Landra, obispo auxiliar de Mercedes-Luján: 5 santos, 16 beatos (el papa
              León XIV aprobó el 18 de diciembre de 2025 el decreto de beatificación de Enrique Shaw,
              reconociendo el milagro por la curación inexplicable de un niño de 5 años), 8 venerables
              siervos de Dios, 43 siervos de Dios y 14 causas de inicio.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
