export type FotoForma = "retrato" | "paisaje" | "logo";

export type HitoBergoglio = {
  id: string;
  /** Año para ordenar y para el eje. */
  anio: number;
  /** Lo que se lee al lado del nodo: año, periodo o edad. */
  marca: string;
  fecha?: string;
  lugar: string;
  titulo: string;
  texto: string;
  destacado?: "eleccion" | "partida";
  foto?: string;
  fotoAlt?: string;
  fotoForma?: FotoForma;
};

export const HITOS_ARGENTINA: HitoBergoglio[] = [
  {
    id: "nace",
    anio: 1936,
    marca: "1936",
    fecha: "17 de diciembre",
    lugar: "Flores, Buenos Aires",
    titulo: "Nacimiento y bautismo",
    texto:
      "Nace en Flores el 17 de diciembre en la calle Varela 268. Fue bautizado el 25 de diciembre en la Basílica de María Auxiliadora, calle Quintino Bocayuva 144, Almagro.",
  },
  {
    id: "infancia",
    anio: 1940,
    marca: "1940",
    lugar: "Membrillar 531, Flores",
    titulo: "Infancia con sus hermanos",
    texto:
      "Junto a sus cuatro hermanos, vivió su infancia en Membrillar 531, Flores, siendo el primer hijo de Mario Bergoglio y su esposa, Regina María Sívori.",
  },
  {
    id: "jardin",
    anio: 1942,
    marca: "Infancia",
    lugar: "Av. Directorio 2138, Flores",
    titulo: "Jardín y Primera Comunión",
    texto:
      "Jorge Bergoglio ingresó a este jardín de infantes en Instituto Nuestra Señora de la Misericordia y, más tarde, tomó allí su Primera Comunión.",
  },
  {
    id: "primaria",
    anio: 1945,
    marca: "Primaria",
    lugar: "Varela 358, Flores",
    titulo: "Escuela Coronel Cerviño",
    texto:
      "Realiza sus estudios primarios en la Escuela Coronel Ingeniero Pedro Antonio Cerviño, Varela 358, Flores.",
  },
  {
    id: "pupilo",
    anio: 1949,
    marca: "A los 13",
    lugar: "Ramos Mejía",
    titulo: "Internado salesiano",
    texto:
      "Pupilo a los 13 años en el colegio obra de Don Bosco Wilfrid Barón de los Santos Ángeles.",
  },
  {
    id: "tecnico",
    anio: 1950,
    marca: "1950",
    lugar: "Virgilio 1980, Monte Castro",
    titulo: "Técnico químico",
    foto: "/images/timeline/nino.png",
    fotoAlt: "Jorge Bergoglio en edad escolar",
    fotoForma: "retrato",
    texto:
      "En 1950 Jorge Bergoglio ingresa en la Enet N.º 27 Hipólito Yrigoyen para realizar estudios secundarios, donde obtuvo el título de Técnico Químico.",
  },
  {
    id: "llamado",
    anio: 1953,
    marca: "A los 17",
    lugar: "Basílica de San José de Flores",
    titulo: "El llamado",
    texto:
      "A los 17 años decidió consagrar su vida a Dios en la Basílica de San José de Flores, Avda. Rivadavia 6950.",
  },
  {
    id: "jesuita",
    anio: 1958,
    marca: "A los 22",
    lugar: "José Cubas 3543, Villa Devoto",
    titulo: "Seminario y Compañía de Jesús",
    foto: "/images/timeline/ihs.png",
    fotoAlt: "Sello de la Compañía de Jesús",
    fotoForma: "logo",
    texto:
      "A los 22 años ingresó al Seminario Metropolitano de Buenos Aires. Estando allí decidió ser jesuita y luego se trasladó a Chile para iniciar el noviciado de la Compañía de Jesús.",
  },
  {
    id: "santa-fe",
    anio: 1964,
    marca: "1964–65",
    lugar: "Santa Fe",
    titulo: "Maestrillo en Santa Fe",
    foto: "/images/timeline/sacerdote.png",
    fotoAlt: "Bergoglio sacerdote, con un libro",
    fotoForma: "retrato",
    texto:
      "Se traslada a Santa Fe. Colegio de la Inmaculada Concepción de Santa Fe (Manzana Jesuítica). Maestrillo y profesor de Lengua y Literatura (años 1964 y 1965). Conoce a Jorge Luis Borges.",
  },
  {
    id: "salvador",
    anio: 1986,
    marca: "1986–90",
    lugar: "Avda. Callao 542, Balvanera",
    titulo: "Iglesia y Colegio del Salvador",
    texto: "Iglesia y Colegio del Salvador. Vivió Bergoglio desde 1986 a 1990.",
  },
  {
    id: "cordoba",
    anio: 1990,
    marca: "1990–92",
    fecha: "16 de julio de 1990",
    lugar: "Córdoba",
    titulo: "Residencia de la Compañía de Jesús",
    foto: "/images/timeline/obispo.png",
    fotoAlt: "Bergoglio con sotana y cruz pectoral",
    fotoForma: "retrato",
    texto:
      "El 16 de julio de 1990 se traslada a Córdoba a la Residencia Mayor de la Compañía de Jesús. Vivió hasta fines de mayo de 1992, cuando san Juan Pablo II lo nombró obispo auxiliar de Buenos Aires.",
  },
  {
    id: "vicaria",
    anio: 1992,
    marca: "1992–97",
    lugar: "Condarco 545, Flores",
    titulo: "Obispo y vicario en Flores",
    texto:
      "Fue nombrado en la Vicaría de Flores obispo y vicario episcopal de Flores, desde 1992 a 1997.",
  },
  {
    id: "coadjutor",
    anio: 1997,
    marca: "1997",
    lugar: "Buenos Aires",
    titulo: "Arzobispo coadjutor",
    texto: "En 1997 fue promovido a arzobispo coadjutor de Buenos Aires.",
  },
  {
    id: "arzobispo",
    anio: 1998,
    marca: "1998–2013",
    lugar: "Catedral Metropolitana",
    titulo: "Arzobispo de Buenos Aires",
    foto: "/images/timeline/cardenal.png",
    fotoAlt: "Cardenal Bergoglio con mitra y cirio",
    fotoForma: "retrato",
    texto:
      "Desde 1998, fue encargado de celebrar, predicar y gobernar la Arquidiócesis de Buenos Aires hasta su consagración como sumo pontífice en el año 2013. Residencia y trabajo: Arzobispado de Buenos Aires, Rivadavia 415, San Nicolás. Catedral Metropolitana, San Martín 27, Monserrat.",
  },
];

export const HITOS_PAPADO: HitoBergoglio[] = [
  {
    id: "conclave",
    anio: 2013,
    marca: "2013",
    fecha: "13 de marzo",
    lugar: "Ciudad del Vaticano",
    titulo: "Cónclave",
    foto: "/images/timeline/conclave.png",
    fotoAlt: "Francisco saluda tras el cónclave",
    fotoForma: "retrato",
    texto:
      "Cónclave elige pontífice a Francisco, primer papa jesuita y latinoamericano.",
    destacado: "eleccion",
  },
  {
    id: "entronizado",
    anio: 2013,
    marca: "2013",
    fecha: "19 de marzo",
    lugar: "Plaza de San Pedro",
    titulo: "Entronizado",
    foto: "/images/timeline/entronizado.png",
    fotoAlt: "Francisco entronizado el día de San José",
    fotoForma: "retrato",
    texto: "Entronizado como papa Francisco el día de San José.",
  },
  {
    id: "lumen-fidei",
    anio: 2013,
    marca: "2013",
    fecha: "29 de junio",
    lugar: "Roma",
    titulo: "Lumen fidei",
    texto: "Encíclica Lumen fidei, con papa Benedicto XVI.",
  },
  {
    id: "jmj-rio",
    anio: 2013,
    marca: "2013",
    fecha: "23 al 28 de julio",
    lugar: "Río de Janeiro",
    titulo: "JMJ en Río",
    foto: "/images/timeline/jmj-rio.png",
    fotoAlt: "Logo de la JMJ Río 2013",
    fotoForma: "logo",
    texto:
      "Jornada Mundial de la Juventud en Río, Brasil. Fue la primera JMJ presidida por el papa Francisco.",
  },
  {
    id: "evangelii-gaudium",
    anio: 2013,
    marca: "2013",
    lugar: "Roma",
    titulo: "Evangelii gaudium",
    texto: "Exhortación apostólica Evangelii gaudium.",
  },
  {
    id: "misericordia",
    anio: 2015,
    marca: "2015",
    lugar: "Roma",
    titulo: "Jubileo de la Misericordia",
    texto: "Jubileo de la Misericordia. Exhortación Laudato si’.",
  },
  {
    id: "amoris",
    anio: 2016,
    marca: "2016",
    lugar: "Roma",
    titulo: "Amoris laetitia",
    texto: "Exhortación apostólica Amoris laetitia.",
  },
  {
    id: "gaudete",
    anio: 2018,
    marca: "2018",
    fecha: "19 de marzo",
    lugar: "Roma",
    titulo: "Gaudete et exsultate",
    texto: "Exhortación apostólica Gaudete et exsultate (Alégrense y regocíjense).",
  },
  {
    id: "christus-vivit",
    anio: 2019,
    marca: "2019",
    fecha: "25 de marzo",
    lugar: "Roma",
    titulo: "Christus vivit",
    texto: "Exhortación apostólica Christus vivit.",
  },
  {
    id: "amazonia",
    anio: 2019,
    marca: "2019",
    fecha: "28 de octubre",
    lugar: "Roma",
    titulo: "Sínodo de la Amazonia",
    texto: "Sínodo especial para la Amazonia. Exhortación apostólica Querida amazonía.",
  },
  {
    id: "pandemia",
    anio: 2020,
    marca: "2020",
    lugar: "Plaza de San Pedro",
    titulo: "Pandemia mundial",
    foto: "/images/timeline/pandemia.png",
    fotoAlt: "Francisco solo en la Plaza de San Pedro durante la pandemia",
    fotoForma: "retrato",
    texto: "Pandemia mundial.",
  },
  {
    id: "fratelli",
    anio: 2020,
    marca: "2020",
    fecha: "3 de octubre",
    lugar: "Roma",
    titulo: "Fratelli tutti",
    texto: "Encíclica Fratelli tutti.",
  },
  {
    id: "patris",
    anio: 2020,
    marca: "2020",
    fecha: "8 de diciembre",
    lugar: "Roma",
    titulo: "Patris corde",
    texto: "Carta apostólica Patris corde (Con corazón de padre).",
  },
  {
    id: "sinodo",
    anio: 2023,
    marca: "2023–25",
    lugar: "Roma",
    titulo: "Sínodo de la sinodalidad",
    texto: "Sínodo de la sinodalidad, 2023–2025.",
  },
  {
    id: "g7",
    anio: 2024,
    marca: "2024",
    fecha: "13 al 15 de junio",
    lugar: "Apulia",
    titulo: "Inteligencia artificial en el G7",
    texto: "Inteligencia artificial. Al G7 en Apulia.",
  },
  {
    id: "dilexit",
    anio: 2024,
    marca: "2024",
    fecha: "24 de octubre",
    lugar: "Roma",
    titulo: "Dilexit nos",
    texto: "La encíclica Dilexit nos (Nos amó) es la cuarta encíclica del papa Francisco.",
  },
  {
    id: "esperanza",
    anio: 2025,
    marca: "2025",
    fecha: "14 de enero",
    lugar: "Roma",
    titulo: "Autobiografía Esperanza",
    texto: "Autobiografía Esperanza.",
  },
  {
    id: "urbi",
    anio: 2025,
    marca: "2025",
    fecha: "20 de abril",
    lugar: "Plaza de San Pedro",
    titulo: "Urbi et orbi de Pascua",
    foto: "/images/timeline/urbi.png",
    fotoAlt: "Francisco saluda en la bendición Urbi et orbi de Pascua",
    fotoForma: "retrato",
    texto:
      "El Día de Pascuas da la bendición “Urbi et orbi” dejando sus últimas fuerzas a su pueblo. Al día siguiente fallecería.",
  },
  {
    id: "fallece",
    anio: 2025,
    marca: "2025",
    fecha: "21 de abril",
    lugar: "Casa Santa Marta",
    titulo: "Partida",
    texto: "Fallece a las 7.35 de la mañana a los 88 años de edad.",
    destacado: "partida",
  },
];

export const ANIOS_PAPADO = [
  2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
];
