export type TipoFiesta = "fija" | "nacional" | "movil" | "pendiente";

export interface Fiesta {
  id: number;
  nombre: string;
  lugar: string;
  provincia: string;
  region: string;
  fecha: string;
  fechaISO_referencia: string | null;
  mes: number | null;
  tipo: TipoFiesta;
  capitulo: number | "homenaje" | null;
  paginas: string;
  lat: number | null;
  lng: number | null;
  enLibro: boolean;
}

export interface Cluster {
  key: string;
  lat: number;
  lng: number;
  fiestas: Fiesta[];
}

export type FiestaActiva = number | number[] | null;
