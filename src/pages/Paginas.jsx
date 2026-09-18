import { SeccionAutor } from "../features/autor/SeccionAutor";
import { SeccionBergoglio, SeccionTresArgentinos } from "../features/francisco/SeccionBergoglio";
import { SeccionCreditos, SeccionTapa } from "../features/libro/SeccionCreditos";
import { SeccionEscritores } from "../features/escritores/SeccionEscritores";
import { SeccionSantos } from "../features/santos/SeccionSantos";
import { SeccionRedes, SeccionVideo } from "../features/pendientes/SeccionesPendientes";

export function PaginaFrancisco() {
  return <SeccionBergoglio />;
}

export function PaginaTresArgentinos() {
  return <SeccionTresArgentinos />;
}

export function PaginaEscritores() {
  return <SeccionEscritores />;
}

export function PaginaSantos() {
  return <SeccionSantos />;
}

export function PaginaAutor() {
  return <SeccionAutor />;
}

export function PaginaVideo() {
  return <SeccionVideo />;
}

export function PaginaCreditos() {
  return <SeccionCreditos />;
}

export function PaginaTapa() {
  return <SeccionTapa />;
}

export function PaginaRedes() {
  return <SeccionRedes />;
}
