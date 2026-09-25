import { useCallback, useEffect, useState } from "react";
import { Boton } from "../../components/ui/Boton";
import { preloadUrls } from "../../utils/preload";

const SLIDES = [
  {
    src: "/images/slider-01-asuncion.webp",
    alt: "Virgen de la Asunción — Toreo de la Vincha",
    pie: "La Virgen de la Asunción acompaña al pueblo en el Toreo de la Vincha.",
    pieEn: "Our Lady of the Assumption accompanies the people in the Toreo de la Vincha.",
  },
  {
    src: "/images/slider-02-portada.webp",
    alt: "Peregrinos — imagen de portada",
    pie: "Imágenes del libro Peregrinos. 80 Fiestas Populares Argentinas.",
    pieEn: "Images from the book Peregrinos. 80 Popular Argentine Festivals.",
  },
  {
    src: "/images/slider-03-ceferino.webp",
    alt: "Beato Ceferino Namuncurá",
    pie: "El beato Ceferino Namuncurá, presencia viva en las fiestas del sur.",
    pieEn: "Blessed Ceferino Namuncurá, a living presence in the festivals of the south.",
  },
];

const INTERVAL_MS = 6000;

export function SliderPrincipal() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [heroListo, setHeroListo] = useState(false);

  const go = useCallback((next) => {
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    let cancelled = false;
    preloadUrls([SLIDES[0].src]).then(() => {
      if (!cancelled) setHeroListo(true);
    });
    // El resto en background
    preloadUrls(SLIDES.slice(1).map((s) => s.src));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (paused || !heroListo) return undefined;
    const id = window.setInterval(() => go(index + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [index, paused, go, heroListo]);

  const slide = SLIDES[index];

  return (
    <section
      className="relative bg-papel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div id="hero-inicio" className="relative min-h-[100svh] overflow-hidden">
        {!heroListo ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-papel">
            <span className="galeria-loader-spin" aria-hidden />
            <p className="galeria-loader-texto text-base">Cargando…</p>
          </div>
        ) : null}

        {SLIDES.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out ${
              heroListo && i === index ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0.35) 55%, rgba(255,255,255,0.45) 100%)",
          }}
        />

        <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display text-4xl leading-[1.2] tracking-[0.14em] text-azul-petroleo md:text-6xl">
            PEREGRINOS
          </h1>
          <p className="mt-2 text-black font-boldfont-display text-sm tracking-[0.1em] text-azul-logo md:text-lg">
            80 FIESTAS POPULARES ARGENTINAS
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Boton to="/mapa">Ver el mapa de fiestas</Boton>
          </div>
        </div>

        <button
          type="button"
          aria-label="Imagen anterior"
          onClick={() => go(index - 1)}
          className="absolute top-1/2 left-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-azul-petroleo/30 bg-blanco/70 text-azul-petroleo transition hover:bg-blanco md:left-6"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Imagen siguiente"
          onClick={() => go(index + 1)}
          className="absolute top-1/2 right-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-azul-petroleo/30 bg-blanco/70 text-azul-petroleo transition hover:bg-blanco md:right-6"
        >
          ›
        </button>

        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Ir a imagen ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === index
                  ? "scale-110 bg-azul-petroleo"
                  : "bg-azul-petroleo/35 hover:bg-azul-petroleo/60"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="bg-blanco px-4 py-4 text-center text-sm transition-opacity duration-500">
        {slide.pie}
        <span className="caption-en block">{slide.pieEn}</span>
      </p>
    </section>
  );
}
