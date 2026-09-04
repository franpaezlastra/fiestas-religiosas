import { SeccionAutor } from "../components/SeccionAutor";
import { SeccionBergoglio, SeccionTresArgentinos } from "../components/SeccionBergoglio";
import { SeccionCreditos, SeccionTapa } from "../components/SeccionCreditos";
import { SeccionEscritores } from "../components/SeccionEscritores";
import { SeccionSantos } from "../components/SeccionSantos";
import {
  SeccionPapaLeon,
  SeccionRedes,
  SeccionShop,
  SeccionVideo,
} from "../components/SeccionesPendientes";

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

export function PaginaShop() {
  return <SeccionShop />;
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

export function PaginaPapaLeon() {
  return <SeccionPapaLeon />;
}

export function PaginaRedes() {
  return <SeccionRedes />;
}
