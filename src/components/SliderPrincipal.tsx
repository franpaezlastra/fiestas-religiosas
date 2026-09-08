import { Boton } from "./Boton";

const SLIDES = [
  {
    src: "/images/slider-catamarca.jpg",
    alt: "Gruta de la Virgen del Valle, Catamarca",
    pie: "La Virgen del Valle es acompañada por el pueblo catamarqueño en su fiesta cada 8 de diciembre.",
    pieEn: "The Virgin of the Valley is accompanied by the people of Catamarca in her festival every December 8th.",
  },
];

export function SliderPrincipal() {
  const slide = SLIDES[0];

  return (
    <section className="relative bg-papel">
      <div id="hero-inicio" className="relative min-h-[100svh]">
        <img
          src={slide.src}
          alt={slide.alt}
          className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
        />
        <div className="pointer-events-none absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display text-4xl leading-[1.2] tracking-[0.14em] text-azul-petroleo md:text-6xl">
            PEREGRINOS
          </h1>
          <p className="mt-2 font-display text-sm tracking-[0.1em] text-blanco md:text-lg">
            80 FIESTAS POPULARES ARGENTINAS
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Boton to="/mapa">Ver el mapa de fiestas</Boton>
            <Boton to="/shop" variante="secundario">
              Comprar el libro
            </Boton>
          </div>
        </div>
      </div>
      <p className="bg-blanco px-4 py-4 text-center text-sm">
        {slide.pie}
        <span className="caption-en block">{slide.pieEn}</span>
      </p>
    </section>
  );
}
