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
