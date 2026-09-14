import galeria from "../data/galeria.json" with { type: "json" };

const MAPA = galeria as Record<string, number[]>;

export function paginasGaleria(id: number): number[] {
  return MAPA[String(id)] ?? [];
}

export function fotosDe(id: number): string[] {
  return paginasGaleria(id).map((p) => `/images/galeria/p${String(p).padStart(3, "0")}.jpg`);
}

export function fotoPortada(id: number): string | null {
  return fotosDe(id)[0] ?? null;
}
