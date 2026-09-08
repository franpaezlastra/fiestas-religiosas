export type ArgentinoFamoso = {
  id: string;
  nombre: string;
  rol: string;
};

/** Terna del folleto suelto: «Los argentinos más famosos de todos los tiempos». */
export const ARGENTINOS_FAMOSOS: ArgentinoFamoso[] = [
  {
    id: "maradona",
    nombre: "Diego Maradona",
    rol: "Selección argentina",
  },
  {
    id: "francisco",
    nombre: "Papa Francisco",
    rol: "Jorge Mario Bergoglio",
  },
  {
    id: "messi",
    nombre: "Lionel Messi",
    rol: "Selección argentina",
  },
];
