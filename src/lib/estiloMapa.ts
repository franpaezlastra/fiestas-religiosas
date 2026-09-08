import type { StyleSpecification } from "maplibre-gl";

/** Atlas físico-político: relieve de Esri + fronteras y ciudades. Sin API key. */
export const ESTILO_FISICO_POLITICO: StyleSpecification = {
  version: 8,
  name: "Físico político",
  sources: {
    fisico: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 8,
      attribution: "Tiles © Esri — Earthstar Geographics",
    },
    natgeo: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "National Geographic, Esri, Garmin, HERE",
    },
    limites: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Esri, HERE, Garmin",
    },
  },
  layers: [
    { id: "fisico", type: "raster", source: "fisico", maxzoom: 7 },
    { id: "natgeo", type: "raster", source: "natgeo", minzoom: 6 },
    { id: "limites", type: "raster", source: "limites", maxzoom: 7 },
  ],
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
};
