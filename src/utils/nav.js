export const NAV_PRINCIPAL = [
  {
    to: "/mapa",
    label: "Mapa y calendario",
    kicker: "95 fiestas",
    resumen: "Mapa interactivo de Argentina y el calendario mes a mes del libro.",
  },
  {
    to: "/galeria",
    label: "Galería",
    kicker: "Fotos del libro",
    resumen: "Álbumes por fiesta: las fotografías de las celebraciones, para consulta.",
  },
  {
    to: "/francisco",
    label: "Papa Francisco",
    kicker: "Homenaje",
    resumen: "Línea de tiempo de Bergoglio en Argentina y de los 12 años de papado.",
  },
  {
    to: "/santos",
    label: "Santos y beatos",
    kicker: "Capítulo 6",
    resumen: "Ilustración de Alfredo Sabat y el mapa de santos argentinos.",
  },
  {
    to: "/autor",
    label: "Autor y editores",
    kicker: "Fel, Travnik, Tarchini",
    resumen: "Biografías de Federico Lanati y de quienes editaron el libro.",
  },
];

export const NAV_LIBRO = [
  {
    to: "/escritores",
    label: "Escritores",
    kicker: "Colaboraciones",
    resumen: "Quienes escribieron los textos del libro, con su cargo.",
  },
  {
    to: "/tres-argentinos",
    label: "Tres argentinos",
    kicker: "Folleto",
    resumen: "Maradona, Francisco y Messi, como en el folleto del libro.",
  },
  {
    to: "/video",
    label: "Video",
    kicker: "YouTube",
    resumen: "Resumen de las fiestas en el canal del autor.",
  },
  {
    to: "/creditos",
    label: "Créditos",
    kicker: "El equipo",
    resumen: "Créditos, agradecimientos y ficha catalográfica.",
  },
];

export const NAV_TODAS = [...NAV_PRINCIPAL, ...NAV_LIBRO];
