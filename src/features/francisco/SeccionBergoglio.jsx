import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ARGENTINOS_FAMOSOS } from "../../data/argentinos";
import { LineaTiempo } from "../../components/timeline/LineaTiempo";
import { Portadilla } from "../../components/ui/Portadilla";
import { SectionLoader } from "../../components/ui/SectionLoader";
import { SoftImage } from "../../components/ui/SoftImage";
import { fetchPublicFeatured } from "../../redux/slices/peopleSlice";
import { fetchPublicTimelines } from "../../redux/slices/timelinesSlice";
import { selectFeaturedForUi } from "../../utils/peopleAdapter";
import { selectFranciscoTimelines } from "../../utils/timelinesAdapter";
import { isPublicLoading, preloadUrls } from "../../utils/preload";

const FRASES_FRANCISCO = [
  "«Recen por mí».",
  "«Por favor, gracias, perdón».",
  "«Hagan lío».",
  "«Atrevámonos un poco más a primerear».",
  "«Quien soy yo para juzgar».",
  "«Cuidar la casa Común».",
  "«El tiempo es superior al espacio».",
  "«No balconear la vida».",
  "«El mundo necesita más puentes y menos muros».",
  "«No se dejen robar la esperanza y vayan adelante. Que no se las roben. Al contrario: siembren esperanza».",
  "«Tierra, techo y trabajo para todos».",
  "«El todo es más que las partes».",
  "«Todos, Todos, Todos».",
  "«Prefiero una Iglesia accidentada, herida y manchada antes que una Iglesia enferma, cerrada».",
];

function irA(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SeccionBergoglio() {
  const dispatch = useDispatch();
  const [tramo, setTramo] = useState("argentina");
  const [fotosListas, setFotosListas] = useState(false);
  const publicItems = useSelector((s) => s.timelines.publicItems);
  const status = useSelector((s) => s.timelines.status);
  const { argentina, papado, aniosPapado } = useMemo(
    () => selectFranciscoTimelines(publicItems),
    [publicItems],
  );

  const loading = isPublicLoading(status) || !fotosListas;

  useEffect(() => {
    dispatch(fetchPublicTimelines());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    setFotosListas(false);
    const urls = [...argentina, ...papado].map((h) => h.foto).filter(Boolean);
    preloadUrls(urls).then(() => {
      if (!cancelled) setFotosListas(true);
    });
    return () => {
      cancelled = true;
    };
  }, [argentina, papado]);

  useEffect(() => {
    function sync() {
      const papadoEl = document.getElementById("papado-2013");
      if (!papadoEl) return;
      setTramo(papadoEl.getBoundingClientRect().top <= 140 ? "papado" : "argentina");
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <section>
      <Portadilla
        id="bergoglio"
        titulo="Un papa argentino para el mundo"
        kicker="An Argentine Pope for the World"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <p className="max-w-3xl font-light leading-relaxed">
          Infografías de Daniel Fontanarrosa. Primero los 76 años en Argentina; después, los 12 años
          de papado.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`tramo-btn text-left ${tramo === "argentina" ? "is-on" : ""}`}
            onClick={() => irA("argentina-1936")}
          >
            <p className="text-xs uppercase tracking-wide text-celeste-cielo">1936 — 2013</p>
            <p className="mt-1 font-display text-xl text-azul-petroleo">76 años en Argentina</p>
            <p className="mt-2 text-sm font-light">De Flores al arzobispado.</p>
          </button>
          <button
            type="button"
            className={`tramo-btn text-left ${tramo === "papado" ? "is-on" : ""}`}
            onClick={() => irA("papado-2013")}
          >
            <p className="text-xs uppercase tracking-wide text-naranja-libro">2013 — 2025</p>
            <p className="mt-1 font-display text-xl text-azul-petroleo">12 años de papado</p>
            <p className="mt-2 text-sm font-light">Del cónclave a la Pascua de 2025.</p>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <SectionLoader
            texto="Cargando líneas de tiempo…"
            hint="Preparando hitos e imágenes del papado."
          />
        </div>
      ) : (
        <>
      <div className="linea-tramos" role="navigation" aria-label="Tramo en pantalla">
        <div className="mx-auto flex w-full max-w-5xl px-4">
          <button
            type="button"
            className={tramo === "argentina" ? "is-on" : ""}
            onClick={() => irA("argentina-1936")}
          >
            Argentina
          </button>
          <button
            type="button"
            className={tramo === "papado" ? "is-on" : ""}
            onClick={() => irA("papado-2013")}
          >
            Papado
          </button>
        </div>
      </div>

      <div id="argentina-1936" className="scroll-mt-28">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
          <h3 className="titulo-seccion text-[1.75rem] md:text-[2rem]">Vida y acción pastoral</h3>
          <p className="caption-en mt-1 text-sm">Life and pastoral work of Jorge Mario Bergoglio</p>
          <div className="mt-8">
            <LineaTiempo id="linea-argentina" variante="argentina" hitos={argentina} />
          </div>
        </div>
      </div>

      <div id="papado-2013" className="scroll-mt-28">
        <Portadilla
          titulo="Principales acciones del papa Francisco"
          kicker="Main actions of Pope Francis"
        />

        <div className="bg-papel">
          <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
            <h3 className="titulo-seccion text-[1.75rem] md:text-[2rem]">
              Un papa argentino para el mundo
            </h3>
            <p className="mt-3 max-w-2xl font-light leading-relaxed">
              Realizó 47 viajes a 66 países.
            </p>
            <div className="mt-8">
              <LineaTiempo
                id="linea-papado"
                variante="papado"
                hitos={papado}
                ejeAnios={aniosPapado}
              />
            </div>
            <p className="mt-8 text-center font-display text-sm text-azul-logo">21 de abril de 2025</p>

            <blockquote className="mx-auto mt-16 max-w-2xl text-center md:mt-20">
              <p className="font-display text-[1.65rem] leading-snug text-azul-petroleo md:text-[2.15rem] md:leading-tight">
                «Como Jesús, Francisco nos amó hasta el fin.»
              </p>
              <footer className="mt-8 text-sm font-light text-texto md:text-base">
                — Mons. Marcelo Colombo, arzobispo de Mendoza y presidente de la Conferencia
                Episcopal Argentina
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      <section className="border-t border-azul-logo/10 bg-blanco px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h3 className="titulo-seccion text-center text-[1.75rem] md:text-[2rem]">
            Palabras del papa Francisco
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm font-light">
            Frases que marcaron su pontificado.
          </p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FRASES_FRANCISCO.map((frase) => (
              <li
                key={frase}
                className="reveal-scroll flex items-center border border-azul-logo/15 bg-papel px-5 py-6 md:px-6 md:py-8"
              >
                <p className="font-display text-xl leading-snug text-azul-petroleo md:text-2xl">
                  {frase}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
        </>
      )}
    </section>
  );
}

export function SeccionTresArgentinos() {
  const dispatch = useDispatch();
  const featuredItems = useSelector((s) => s.people.featuredItems);
  const featuredStatus = useSelector((s) => s.people.featuredStatus);
  const fromApi = useMemo(() => selectFeaturedForUi(featuredItems), [featuredItems]);
  const personas = fromApi?.length ? fromApi : ARGENTINOS_FAMOSOS;
  const [vitralSrc, setVitralSrc] = useState("/images/argentinos-mas-famosos.webp");
  const [vitralListo, setVitralListo] = useState(false);
  const loading = isPublicLoading(featuredStatus) || !vitralListo;

  useEffect(() => {
    dispatch(fetchPublicFeatured());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    setVitralListo(false);
    preloadUrls([vitralSrc]).then(() => {
      if (!cancelled) setVitralListo(true);
    });
    return () => {
      cancelled = true;
    };
  }, [vitralSrc]);

  return (
    <section>
      <Portadilla
        id="tres-argentinos"
        titulo="Los argentinos más famosos"
        kicker="The most famous Argentines of all time"
      />
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        {loading ? (
          <SectionLoader
            texto="Cargando…"
            hint="Preparando el folleto de los tres argentinos."
          />
        ) : (
          <>
            <figure>
              <div className="foto-libro bg-papel [&_img]:h-auto [&_img]:object-contain">
                <SoftImage
                  src={vitralSrc}
                  alt="Vitral con Diego Maradona, el papa Francisco y Lionel Messi"
                  eager
                  onError={() => {
                    if (vitralSrc.endsWith(".webp")) {
                      setVitralSrc("/images/argentinos-mas-famosos.jpg");
                    }
                  }}
                />
              </div>
              <figcaption className="mt-3 text-sm">
                Los argentinos más famosos de todos los tiempos.
                <span className="caption-en block">The most famous Argentines of all time.</span>
              </figcaption>
            </figure>

            <ul className="mt-10 space-y-6">
              {personas.map((a) => (
                <li
                  key={a.id || a.nombre}
                  className="reveal-scroll border-b border-azul-logo/15 pb-6 last:border-0"
                >
                  <div className="flex gap-4">
                    {a.foto ? (
                      <SoftImage
                        src={a.foto}
                        alt=""
                        className="h-16 w-12 shrink-0"
                        imgClassName="h-full w-full object-cover object-top"
                        eager
                      />
                    ) : null}
                    <div>
                      <p className="font-display text-xl text-azul-petroleo">{a.nombre}</p>
                      {a.rol ? (
                        <p className="mt-1 text-sm font-medium uppercase tracking-wide text-azul-logo">
                          {a.rol}
                        </p>
                      ) : null}
                      {a.bio ? (
                        <p className="mt-2 text-sm font-light leading-relaxed">{a.bio}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
