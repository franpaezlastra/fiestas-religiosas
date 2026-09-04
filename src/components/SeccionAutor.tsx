import { Portadilla } from "./Portadilla";

export function SeccionAutor() {
  return (
    <section>
      <Portadilla id="autor" titulo="El autor y los editores" kicker="The author and the editors" />
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <h3 className="font-display text-2xl text-azul-petroleo">Federico Lanati</h3>
        <div className="mt-4 space-y-4 font-light leading-relaxed">
          <p>
            Federico Lanati nació en 1960 y vive en Tucumán, Argentina. Abogado, empresario del
            rubro hotelero gastronómico y concesionario automotor. Luego de su paso por la música y
            la pintura se dedicó a la fotografía desde 1995, participando en los talleres de Bruno
            Ternavasio, Solana Peña Lasalle y Juan Travnik.
          </p>
          <p>
            Sus trabajos en muestras individuales fueron en Tafí del Valle –Corral de Pircas, en
            Club de Veraneantes 2011; en Expotrastiendas, Sala Camargo, en La Rural de Buenos Aires
            2011; Museo de Arte Sacro de Tucumán (diciembre 2016) y Congreso Nacional de Turismo
            Religioso (Córdoba 2016); en Salta (Marzo a Julio 2020, Centro Cultural América), en
            Catamarca (Casa SFVC, septiembre 2021), Santiago del Estero (Centro Cultural Casa
            Argañaraz Alcorta 2023), Centro Cultural “Alberto Rougués” de la Fundación Miguel Lillo
            en Tucumán (diciembre 2023 a marzo 2024), en este caso expuso junto a su padre, el
            pintor Juan Carlos Lanati, en la muestra “Reflejar la fe”.
          </p>
          <p>
            Publicó su primer libro de fotografías “Fiestas religiosas del norte argentino y Luján”
            en 2020, y ahora “Peregrinos. 80 fiestas populares argentinas” en 2026.
          </p>
          <p>
            Es presidente de ATRA (Asociación Argentina de Turismo Religioso), presidente de ACARA
            (Asociación Concesionarios Automotores de la República Argentina) Regional Tucumán, y
            miembro de la comisión directiva de ACARA nacional. Vicepresidente I de la Cámara de
            Turismo de Tucumán, Past Presidente de ACDE (Asociación Cristiana de Dirigentes de
            Empresas) Tucumán, miembro de la Mesa de Diálogo de Tucumán y del Consejo Económico
            Social del Municipio de San Miguel de Tucumán, y miembro de la comisión directiva del
            Museo de Arte Sacro de Tucumán.
          </p>
          <p>
            Fue presidente de FEDECATUR (Federación de Cámaras de Turismo de la Argentina),
            vicepresidente de CAT (Cámara Argentina de Turismo) y presidente de Skal Internacional
            Argentina.
          </p>
          <p>Reflejar la fe en Argentina a través de la religiosidad popular es su motivación principal como fotógrafo.</p>
        </div>

        <h3 className="mt-14 font-display text-2xl text-azul-petroleo">Gustavo Tarchini</h3>
        <p className="mt-4 font-light leading-relaxed">
          Gustavo Tarchini fue un destacado fotógrafo santiagueño (1965–2025), docente y gestor
          cultural argentino, considerado un referente esencial de la fotografía documental de su
          provincia. Su obra se centró en capturar la identidad santiagueña, explorando distintos
          temas del “monte santiagueño” y la religiosidad popular. Tuvo varios premios y libros
          publicados. Fue profesor en la Universidad Católica de Santiago del Estero. Fue el editor
          de este libro, realizando su labor durante más de dos años, dejando una huella imborrable
          de sus conocimientos, su sensibilidad y muestras de cariño hacia el autor. Compartió sus
          últimos días, luego de una larga dolencia, en su casa con su querida mujer Viviana
          Volmaro, su hijo Francisco y su nieta Guillermina.
        </p>

        <h3 className="mt-14 font-display text-2xl text-azul-petroleo">Juan Travnik</h3>
        <p className="mt-4 font-light leading-relaxed">
          Juan Travnik nació en Argentina en 1950. Fotógrafo, docente y curador. Miembro de número
          de la Academia Nacional de Bellas Artes, creó y dirigió la licenciatura en Fotografía de
          la Universidad Nacional de San Martín desde 2016 hasta 2025. Dirigió también la
          FotoGalería del Teatro San Martín entre 1998 y 2015. Ha participado en encuentros y
          festivales internacionales, y es autor de numerosas notas, catálogos y ensayos. Ha
          expuesto en numerosos países y su obra se encuentra en colecciones públicas y privadas de
          Argentina y del exterior, entre ellas el Museo Nacional de Bellas Artes (Buenos Aires),
          Maison Européenne de la Photographie (París), Museum of Fine Arts (Houston), Bibliothèque
          Nationale de France (París), Universidad de Salamanca (España), Musée de la Photographie
          (Charleroi, Bélgica) y Museet for Fotokunst (Odense, Dinamarca). En 2024 fue nombrado
          Personalidad Destacada de la Cultura por la Legislatura de la Ciudad de Buenos Aires.
          Entre otras distinciones, obtuvo el Premio Nacional a la Trayectoria Artística (2022), el
          Konex de Platino (2012), la Beca John Simon Guggenheim (2006) y el Primer Premio de la
          Fundación Federico Klemm (2004). Entre sus publicaciones principales: “Materia”
          (Ediciones Larivière, 2023), “Juan Travnik. Paisajes” (Antennae Collection, Nueva York,
          2014), “Malvinas. Retratos y paisajes de guerra” (Ediciones Larivière, 2008), “Los
          restos” (Dilan Editores, 2007) y “Juan Travnik” (Ediciones Universidad de Salamanca,
          1997).
        </p>
      </div>
    </section>
  );
}
