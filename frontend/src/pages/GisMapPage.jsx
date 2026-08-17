import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { getGisLayersAnalyticsApi } from '../services/analyticsService';
import Card from '../components/common/Card';

import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import {
  Map, Layers, Mountain, Navigation, Compass, Eye, EyeOff,
  MapPin, Zap, TreePine, RefreshCw, Info, Sun, Wind, CheckCircle2,
  DollarSign, ShieldAlert, Waves, Route
} from 'lucide-react';

let L;

export default function GisMapPage() {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const layersGroupRef = useRef({});

  const [gisData, setGisData] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 10 Layer Toggle Toggles
  const [layers, setLayers] = useState({
    siteMarkers: true,
    roads: true,
    substations: true,
    transmissionLines: true,
    waterBodies: true,
    protectedAreas: true,
    suitabilityHeatmap: true,
    solarPotential: true,
    windPotential: true,
    bufferZones: true,
  });

  const [showSatellite, setShowSatellite] = useState(false);

  const toggleLayer = (key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Load GIS analytics layers data from backend API
  useEffect(() => {
    const loadGis = async () => {
      setLoading(true);
      try {
        const data = await getGisLayersAnalyticsApi();
        setGisData(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load GIS layer data from backend.');
      } finally {
        setLoading(false);
      }
    };
    loadGis();
  }, []);

  // Initialize Map — runs once on mount. mapRef.current is always available
  // because the map div is rendered unconditionally (outside the loading gate).
  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('GIS MAP INITIALIZING');
        const leaflet = await import('leaflet');
        L = leaflet.default || leaflet;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (mapRef.current && !leafletMapRef.current) {
          const mapInstance = L.map(mapRef.current, {
            center: [20, 0],
            zoom: 3,
            zoomControl: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(mapInstance);

          leafletMapRef.current = mapInstance;
          console.log('GIS MAP CREATED');

          // Force size recalculation after paint
          setTimeout(() => { mapInstance.invalidateSize(); }, 300);
        }
      } catch (err) {
        console.error('Leaflet init error:', err);
      }
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        L = undefined;
      }
    };
  }, []);

  // After GIS data finishes loading, re-trigger invalidateSize so the map
  // knows its container is now fully painted.
  useEffect(() => {
    if (!loading && leafletMapRef.current) {
      setTimeout(() => { leafletMapRef.current.invalidateSize(); }, 150);
    }
  }, [loading]);

  // Render & update layers on Leaflet Map
  useEffect(() => {
    if (!leafletMapRef.current || !gisData || !L) return;

    const map = leafletMapRef.current;

    // Clear old layer groups
    Object.values(layersGroupRef.current).forEach(grp => {
      if (map.hasLayer(grp)) map.removeLayer(grp);
    });
    layersGroupRef.current = {};

    const sitesGeojson = gisData.sites_geojson?.features || [];
    const bounds = [];

    // --- 1. SITE MARKERS & POPUPS ---
    if (layers.siteMarkers) {
      const siteGroup = L.layerGroup();
      sitesGeojson.forEach(feat => {
        const props = feat.properties;
        const [lon, lat] = feat.geometry.coordinates;
        if (lat == null || lon == null) return;
        bounds.push([lat, lon]);

        const scoreColor = props.suitability_score >= 80 ? '#10b981' : props.suitability_score >= 65 ? '#0ea5e9' : '#f59e0b';

        const markerHtml = `
          <div style="
            width:32px; height:32px; border-radius:50% 50% 50% 0;
            transform:rotate(-45deg); background:${scoreColor};
            border:3px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.5);
            display:flex; align-items:center; justify-content:center;
          ">
            <span style="transform:rotate(45deg); color:#000; font-weight:900; font-size:10px;">${Math.round(props.suitability_score)}</span>
          </div>`;

        const icon = L.divIcon({
          html: markerHtml,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const popupHtml = `
          <div style="font-family:sans-serif; font-size:12px; min-width:240px; color:#f8fafc; background:#0f172a; padding:12px; border-radius:12px; border:1px solid #334155;">
            <div style="font-weight:800; font-size:15px; color:#38bdf8; margin-bottom:4px;">${props.site_name}</div>
            <div style="font-family:monospace; font-size:11px; color:#94a3b8; margin-bottom:8px;">
              Lat: ${lat.toFixed(5)}° | Lon: ${lon.toFixed(5)}°
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#1e293b; padding:8px; border-radius:8px; font-family:monospace; margin-bottom:8px;">
              <div>Suitability: <strong style="color:#10b981;">${props.suitability_score}/100</strong></div>
              <div>Category: <strong style="color:#38bdf8;">${props.suitability_category}</strong></div>
              <div>Solar Score: <strong style="color:#fbbf24;">${props.solar_score}</strong></div>
              <div>Wind Score: <strong style="color:#38bdf8;">${props.wind_score}</strong></div>
            </div>
            <div style="background:#1e293b; padding:8px; border-radius:8px; font-family:monospace; line-height:1.4;">
              <div>Technology: <strong style="color:#c084fc;">${props.recommended_technology}</strong></div>
              <div>Expected Output: <strong style="color:#38bdf8;">${props.expected_energy_mwh != null ? Number(props.expected_energy_mwh).toLocaleString() : 'N/A'} MWh/yr</strong></div>
              <div>Est. Revenue: <strong style="color:#10b981;">$${props.estimated_revenue_usd != null ? Number(props.estimated_revenue_usd).toLocaleString() : 'N/A'}/yr</strong></div>
            </div>
          </div>`;

        const marker = L.marker([lat, lon], { icon }).bindPopup(popupHtml, { maxWidth: 300 });
        marker.on('click', () => setSelectedSite(props));
        marker.addTo(siteGroup);

        // 500m Buffer Zones
        if (layers.bufferZones) {
          L.circle([lat, lon], {
            radius: 500,
            color: '#38bdf8',
            fillColor: '#0ea5e9',
            fillOpacity: 0.1,
            weight: 1.5,
            dashArray: '4 4',
          }).addTo(siteGroup);
        }

        // Solar / Wind Potential Vector overlays around site
        if (layers.solarPotential) {
          L.circle([lat + 0.005, lon - 0.005], {
            radius: 800,
            color: '#f59e0b',
            fillColor: '#fbbf24',
            fillOpacity: 0.18,
            weight: 1,
          }).addTo(siteGroup);
        }

        if (layers.windPotential) {
          L.circle([lat - 0.005, lon + 0.005], {
            radius: 900,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.18,
            weight: 1,
          }).addTo(siteGroup);
        }
      });

      siteGroup.addTo(map);
      layersGroupRef.current.sites = siteGroup;
    }

    // --- 2. ROADS LAYER ---
    if (layers.roads && gisData.infrastructure?.roads) {
      const roadGroup = L.layerGroup();
      gisData.infrastructure.roads.forEach(path => {
        L.polyline(path, { color: '#e2e8f0', weight: 3.5, opacity: 0.8, dashArray: '6 4' }).addTo(roadGroup);
      });
      roadGroup.addTo(map);
      layersGroupRef.current.roads = roadGroup;
    }

    // --- 3. SUBSTATIONS LAYER ---
    if (layers.substations && gisData.infrastructure?.substations) {
      const subGroup = L.layerGroup();
      gisData.infrastructure.substations.forEach(sub => {
        const subIcon = L.divIcon({
          html: `<div style="background:#f59e0b; color:#000; border-radius:4px; padding:3px 6px; font-weight:bold; font-size:10px; border:1px solid #fff; box-shadow:0 2px 6px rgba(0,0,0,0.5);">⚡ ${sub.voltage}</div>`,
          className: '',
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        });
        L.marker([sub.lat, sub.lng], { icon: subIcon })
          .bindPopup(`<strong>${sub.name}</strong><br/>Grid Voltage: ${sub.voltage}`)
          .addTo(subGroup);
      });
      subGroup.addTo(map);
      layersGroupRef.current.substations = subGroup;
    }

    // --- 4. TRANSMISSION LINES LAYER ---
    if (layers.transmissionLines && gisData.infrastructure?.transmission_lines) {
      const tlineGroup = L.layerGroup();
      gisData.infrastructure.transmission_lines.forEach(path => {
        L.polyline(path, { color: '#a855f7', weight: 3, opacity: 0.9 }).addTo(tlineGroup);
      });
      tlineGroup.addTo(map);
      layersGroupRef.current.tlines = tlineGroup;
    }

    // --- 5. WATER BODIES LAYER ---
    if (layers.waterBodies && gisData.environmental_constraints?.water_bodies) {
      const waterGroup = L.layerGroup();
      gisData.environmental_constraints.water_bodies.forEach(poly => {
        L.polygon(poly, { color: '#0284c7', fillColor: '#0ea5e9', fillOpacity: 0.4, weight: 1.5 }).addTo(waterGroup);
      });
      waterGroup.addTo(map);
      layersGroupRef.current.water = waterGroup;
    }

    // --- 6. PROTECTED AREAS LAYER ---
    if (layers.protectedAreas && gisData.environmental_constraints?.protected_areas) {
      const protGroup = L.layerGroup();
      gisData.environmental_constraints.protected_areas.forEach(poly => {
        L.polygon(poly, { color: '#ef4444', fillColor: '#f87171', fillOpacity: 0.35, weight: 1.5, dashArray: '5 5' }).addTo(protGroup);
      });
      protGroup.addTo(map);
      layersGroupRef.current.protected = protGroup;
    }

    // Adjust view bounds to show all mapped features
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 });
    }

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

  }, [gisData, layers]);


  // Toggle Street vs Satellite view
  const toggleSatellite = () => {
    if (!leafletMapRef.current || !L) return;
    setShowSatellite(prev => {
      const next = !prev;
      const map = leafletMapRef.current;
      map.eachLayer(layer => {
        if (layer._url) map.removeLayer(layer);
      });
      if (next) {
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri World Imagery', maxZoom: 19,
        }).addTo(map);
      } else {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors', maxZoom: 19,
        }).addTo(map);
      }
      return next;
    });
  };

  const siteFeatures = gisData?.sites_geojson?.features || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Map className="w-6 h-6 text-orange-500" />
            <span>PostGIS Multi-Layer GIS Analytics Map</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Displaying 10 geospatial vector layers: candidate sites, roads, substations, grid lines, water bodies, protected areas, heatmaps, and resource layers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge type="info">EPSG:4326 (WGS84)</Badge>
          <Badge type="success">{siteFeatures.length} Sites Mapped</Badge>
        </div>
      </div>

      <ErrorMessage message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls & Layer Checklist */}
        <div className="space-y-4">

          {loading && <Loading message="Loading GIS spatial layers from PostGIS backend..." />}

          {!loading && (
            <Card title="Geospatial Layers" subtitle="Toggle 10 GIS vector & raster layers">
              <div className="space-y-1.5 text-xs">
                {[
                  { key: 'siteMarkers', label: 'Project Sites & Markers', icon: MapPin, color: 'text-emerald-700' },
                  { key: 'roads', label: 'Road Networks', icon: Route, color: 'text-slate-700' },
                  { key: 'substations', label: 'Electrical Substations', icon: Zap, color: 'text-orange-600' },
                  { key: 'transmissionLines', label: 'Transmission Grid Lines', icon: Zap, color: 'text-purple-700' },
                  { key: 'waterBodies', label: 'Water Bodies', icon: Waves, color: 'text-sky-700' },
                  { key: 'protectedAreas', label: 'Protected Wildlife Areas', icon: ShieldAlert, color: 'text-red-600' },
                  { key: 'suitabilityHeatmap', label: 'Suitability Heatmap', icon: Compass, color: 'text-emerald-700' },
                  { key: 'solarPotential', label: 'Solar Potential Layer (GHI)', icon: Sun, color: 'text-orange-600' },
                  { key: 'windPotential', label: 'Wind Potential Layer (WPD)', icon: Wind, color: 'text-sky-700' },
                  { key: 'bufferZones', label: '500m Setback Buffer Zones', icon: Compass, color: 'text-sky-600' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <label key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-orange-300 transition-colors shadow-xs">
                    <span className={`font-bold flex items-center gap-2 ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </span>
                    <button
                      onClick={() => toggleLayer(key)}
                      className={`p-1 rounded-md transition-colors ${layers[key] ? color : 'text-slate-400'}`}
                    >
                      {layers[key] ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </label>
                ))}

                <button
                  onClick={toggleSatellite}
                  className={`w-full flex items-center justify-center gap-2 p-2.5 mt-3 rounded-xl border font-bold transition-all text-xs shadow-xs ${
                    showSatellite
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Layers className="w-4 h-4 text-orange-500" />
                  {showSatellite ? 'Switch to Street Map' : 'Switch to Satellite Imagery'}
                </button>
              </div>
            </Card>
          )}

          {/* Selected Site Popup Detail */}
          {selectedSite && (
            <Card title="Selected Site GIS Detail" subtitle={selectedSite.site_name}>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-slate-500 text-[10px] font-medium">Location Coordinates</p>
                  <p className="text-slate-900 font-bold">
                    {selectedSite.latitude?.toFixed(5)}°N, {selectedSite.longitude?.toFixed(5)}°W
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] text-slate-500 font-medium">Suitability</p>
                    <p className="font-bold text-emerald-700">{selectedSite.suitability_score}/100</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
                    <p className="text-[10px] text-slate-500 font-medium">Technology</p>
                    <p className="font-bold text-purple-700">{selectedSite.recommended_technology}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-[10px] text-slate-500 font-medium">Solar Score</p>
                    <p className="font-bold text-orange-600">{selectedSite.solar_score}/100</p>
                  </div>
                  <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
                    <p className="text-[10px] text-slate-500 font-medium">Wind Score</p>
                    <p className="font-bold text-sky-700">{selectedSite.wind_score}/100</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Expected Energy:</span>
                    <span className="text-sky-700 font-bold">{selectedSite.expected_energy_mwh?.toLocaleString()} MWh/yr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Est. Revenue:</span>
                    <span className="text-emerald-700 font-bold">${selectedSite.estimated_revenue_usd?.toLocaleString()}/yr</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Interactive Leaflet Map — always rendered so mapRef is available on mount */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base tracking-tight">PostGIS GIS Layers Engine</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click any site marker to view spatial attributes</p>
              </div>
            </div>
            {/* Map container: NOT wrapped in overflow-hidden; Leaflet tile pane is absolutely positioned */}
            <div
              ref={mapRef}
              className="w-full rounded-xl border border-slate-200 shadow-sm"
              style={{ height: '620px', minHeight: '620px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

