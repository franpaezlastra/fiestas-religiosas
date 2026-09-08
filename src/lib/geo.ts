import type { Cluster, Fiesta } from "./types";

export type ProjectBounds = {
  minlon: number;
  maxlon: number;
  minlat: number;
  maxlat: number;
  width: number;
  height: number;
  pad: number;
};

export function project(
  lon: number,
  lat: number,
  { minlon, maxlon, minlat, maxlat, width, height, pad }: ProjectBounds,
) {
  const scale = Math.min(
    (width - 2 * pad) / (maxlon - minlon),
    (height - 2 * pad) / (maxlat - minlat),
  );
  const offx = pad + (width - 2 * pad - (maxlon - minlon) * scale) / 2;
  const offy = pad + (height - 2 * pad - (maxlat - minlat) * scale) / 2;
  return {
    x: offx + (lon - minlon) * scale,
    y: offy + (maxlat - lat) * scale,
  };
}

export type PinMapa = {
  fiesta: Fiesta;
  lat: number;
  lng: number;
  offset: [number, number];
};

/** Separa pines que caen en la misma esquina, en círculo (píxeles). */
export function pinesSeparados(clusters: Cluster[]): PinMapa[] {
  const out: PinMapa[] = [];
  for (const c of clusters) {
    const n = c.fiestas.length;
    const radio = n === 1 ? 0 : 12 + n * 2;
    c.fiestas.forEach((fiesta, i) => {
      const angulo = n === 1 ? 0 : (2 * Math.PI * i) / n - Math.PI / 2;
      out.push({
        fiesta,
        lat: c.lat,
        lng: c.lng,
        offset: [Math.round(Math.cos(angulo) * radio), Math.round(Math.sin(angulo) * radio)],
      });
    });
  }
  return out;
}

export function clusterFiestas(fiestas: Fiesta[]): Cluster[] {
  const groups = new Map<string, Cluster>();
  for (const f of fiestas) {
    if (f.lat == null || f.lng == null || f.tipo === "nacional") continue;
    const key = `${f.lat.toFixed(3)}|${f.lng.toFixed(3)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.fiestas.push(f);
    } else {
      groups.set(key, { key, lat: f.lat, lng: f.lng, fiestas: [f] });
    }
  }
  return [...groups.values()];
}

export function capituloLabel(capitulo: Fiesta["capitulo"]): string | null {
  if (capitulo === "homenaje") return "Homenaje al Papa";
  if (capitulo == null) return null;
  return `Capítulo ${capitulo}`;
}
