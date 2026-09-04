export type NavItem = {
  to: string;
  label: string;
  kicker: string;
  resumen: string;
};

export const NAV_PRINCIPAL: NavItem[] = [
  {
    to: "/mapa",
    label: "Mapa y calendario",
    kicker: "95 fiestas",
    resumen: "Mapa interactivo de Argentina y el calendario mes a mes del libro.",
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
  {
    to: "/shop",
    label: "Comprar",
    kicker: "Shop",
    resumen: "Edición bilingüe, ISBN y venta del libro.",
  },
];

export const NAV_LIBRO: NavItem[] = [
  {
    to: "/escritores",
    label: "Escritores",
    kicker: "Colaboraciones",
    resumen: "Quienes escribieron los textos del libro, con su cargo.",
  },
  {
    to: "/tres-argentinos",
    label: "Tres argentinos",
    kicker: "Pendiente",
    resumen: "Sección pedida por el autor; el contenido todavía no llegó.",
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
  {
    to: "/el-libro",
    label: "Tapa e ISBN",
    kicker: "978-631-01-7027-5",
    resumen: "Tapa, contratapa y datos de la edición.",
  },
  {
    to: "/papa-leon",
    label: "León XIV",
    kicker: "Entrega",
    resumen: "La foto de la entrega del libro al papa León XIV.",
  },
  {
    to: "/redes",
    label: "Redes",
    kicker: "Instagram y Facebook",
    resumen: "Cuentas oficiales para seguir el proyecto.",
  },
];

export const NAV_TODAS = [...NAV_PRINCIPAL, ...NAV_LIBRO];
