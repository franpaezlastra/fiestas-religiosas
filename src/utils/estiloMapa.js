

/** Atlas físico-político: relieve de Esri + fronteras y ciudades. Sin API key. */
export const ESTILO_FISICO_POLITICO = {
  version: 8,
  name: "Físico político",
  sources: {
    fisico: {
      type: "raster",
      tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}"],

      tileSize: 256,
      maxzoom: 8,
      attribution: "Tiles © Esri — Earthstar Geographics"
    },
    natgeo: {
      type: "raster",
      tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"],

      tileSize: 256,
      attribution: "National Geographic, Esri, Garmin, HERE"
    },
    limites: {
      type: "raster",
      tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],

      tileSize: 256,
      attribution: "Esri, HERE, Garmin"
    },
    provincias: {
      type: "geojson",
      data: "/geo/provincias.geojson",
      attribution: "Límites provinciales © IGN / geoAr"
    }
  },
  layers: [
  { id: "fisico", type: "raster", source: "fisico", maxzoom: 7 },
  { id: "natgeo", type: "raster", source: "natgeo", minzoom: 6 },
  { id: "limites", type: "raster", source: "limites", maxzoom: 7 },
  {
    id: "provincias-halo",
    type: "line",
    source: "provincias",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#f7f4ee",
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 2.6, 5, 3.8, 7, 5.2],
      "line-opacity": 0.92
    }
  },
  {
    id: "provincias-borde",
    type: "line",
    source: "provincias",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#415d82",
      "line-width": ["interpolate", ["linear"], ["zoom"], 3, 1.15, 5, 1.7, 7, 2.3],
      "line-opacity": 0.95
    }
  }],

  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"
};