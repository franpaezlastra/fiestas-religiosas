import { Link } from "react-router-dom";

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
    <section className="bg-black">
      <div className="relative h-[62vh] min-h-[320px] md:h-[78vh]">
        <img
          src={slide.src}
          alt={slide.alt}
          className="h-full w-full object-cover object-center"
        />
      </div>
      <div className="bg-azul-petroleo px-4 py-6 text-center text-blanco md:py-8">
        <h1 className="font-display text-3xl tracking-[0.16em] md:text-5xl">PEREGRINOS</h1>
        <p className="mt-2 font-display text-sm tracking-[0.1em] text-celeste-cielo md:text-base">
          80 FIESTAS POPULARES ARGENTINAS
        </p>
        <p className="caption-en mt-1 text-sm text-blanco/80">
          PILGRIMS. 80 Popular Festivities in Argentina
        </p>
        <p className="mt-3 text-sm font-light">Federico Lanati · ISBN 978-631-01-7027-5</p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/mapa"
            className="bg-celeste-cielo px-6 py-3 font-body text-sm font-medium text-blanco"
          >
            Ver el mapa de fiestas
          </Link>
          <Link
            to="/shop"
            className="border border-blanco px-6 py-3 font-body text-sm font-medium text-blanco"
          >
            Comprar el libro
          </Link>
        </div>
      </div>
      <p className="bg-blanco px-4 py-3 text-center text-sm">
        {slide.pie}
        <span className="caption-en block">{slide.pieEn}</span>
      </p>
    </section>
  );
}
