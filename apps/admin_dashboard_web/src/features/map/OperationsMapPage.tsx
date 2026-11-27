import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSONSource, Map as MapLibreMap, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import type { ErrorEvent, MapMouseEvent } from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { Activity, BusFront, CircleDot, Layers3, MapPin, Navigation, Route as RouteIcon, Search } from 'lucide-react';
import { mockAdminApi } from '../../data/mockAdminApi';
import type { Driver, RideRequest, TransitRoute, Trip } from '../../data/types';
import { useMockResource } from '../../hooks/useMockResource';
import { PageHeading, StatusBadge } from '../../components/ui';
import './maplibre-map.css';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(workerUrl);

const requestPoints = [{ x: 57, y: 30 }, { x: 32, y: 47 }, { x: 73, y: 67 }, { x: 47, y: 70 }, { x: 83, y: 39 }];
const tripOrigins = [{ x: 38, y: 30 }, { x: 66, y: 41 }, { x: 47, y: 62 }, { x: 77, y: 70 }];
const alexandriaCenter: [number, number] = [29.9187, 31.2001];
type MapProperties = { id: string; name: string; state?: string; color?: string; detail?: string };
type PointFeature = Feature<Point, MapProperties>;
type LineFeature = Feature<LineString, MapProperties>;
type PointCollection = FeatureCollection<Point, MapProperties>;
type LineCollection = FeatureCollection<LineString, MapProperties>;
type MapSelection = { kind: 'driver'; item: Driver } | { kind: 'request'; item: RideRequest } | { kind: 'trip'; item: Trip } | { kind: 'route'; item: TransitRoute } | { kind: 'station'; name: string } | null;
type Layers = { drivers: boolean; requests: boolean; trips: boolean; stations: boolean; routes: boolean };

// إحداثيات عينة تقريبية حول الإسكندرية؛ لا تمثل GPS أو بيانات تشغيل فعلية.
function demoLngLat(x: number, y: number): [number, number] {
  return [29.70 + x * 0.0035, 31.31 - y * 0.0025];
}

function pointFeature(id: string, coordinates: [number, number], properties: Omit<MapProperties, 'id'>): PointFeature {
  return { type: 'Feature', geometry: { type: 'Point', coordinates }, properties: { id, ...properties } };
}

function lineFeature(id: string, coordinates: [number, number][], properties: Omit<MapProperties, 'id'>): LineFeature {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: { id, ...properties } };
}

function pointCollection(features: PointFeature[]): PointCollection {
  return { type: 'FeatureCollection', features };
}

function lineCollection(features: LineFeature[]): LineCollection {
  return { type: 'FeatureCollection', features };
}

function syncGeoJson(map: MapLibreMap, id: string, data: PointCollection | LineCollection) {
  const existing = map.getSource(id);
  if (existing instanceof GeoJSONSource) existing.setData(data);
  else if (!existing) map.addSource(id, { type: 'geojson', data });
}

export function OperationsMapPage() {
  const loader = useCallback(() => mockAdminApi.getMapSnapshot(), []);
  const { data, loading, error, reload } = useMockResource(loader);
  const [layers, setLayers] = useState<Layers>({ drivers: true, requests: true, trips: true, stations: true, routes: true });
  const [selected, setSelected] = useState<MapSelection>(null);
  const [search, setSearch] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const snapshotRef = useRef(data);
  snapshotRef.current = data;
  const visibleDrivers = useMemo(() => (data?.drivers ?? []).filter((driver) => driver.name.includes(search) || driver.id.toLowerCase().includes(search.toLowerCase())), [data, search]);
  const activeDrivers = visibleDrivers.filter((driver) => driver.state === 'متاح' || driver.state === 'في رحلة');
  const toggleLayer = (key: keyof Layers) => setLayers((current) => ({ ...current, [key]: !current[key] }));

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: alexandriaCenter,
      zoom: 11,
      minZoom: 9,
      maxZoom: 18,
    });
    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), 'bottom-left');
    mapRef.current = map;
    const onLoad = () => { setMapReady(true); setMapError(''); };
    const onError = (event: ErrorEvent) => {
      if (event.error?.message) setMapError('تعذر جلب خلفية الخريطة. تحقق من اتصال الإنترنت ثم أعد فتح الصفحة.');
    };
    const onClick = (event: MapMouseEvent) => {
      const current = snapshotRef.current;
      if (!current) return;
      const interactiveLayers = ['drivers-layer', 'requests-layer', 'trips-layer', 'routes-layer', 'stations-layer'].filter((id) => Boolean(map.getLayer(id)));
      if (interactiveLayers.length === 0) return;
      const feature = map.queryRenderedFeatures(event.point, { layers: interactiveLayers })[0];
      if (!feature) return;
      const properties = (feature.properties ?? {}) as MapProperties;
      if (feature.layer.id === 'drivers-layer') {
        const item = current.drivers.find((driver) => driver.id === properties.id);
        if (item) setSelected({ kind: 'driver', item });
      } else if (feature.layer.id === 'requests-layer') {
        const item = current.requests.find((request) => request.id === properties.id);
        if (item) setSelected({ kind: 'request', item });
      } else if (feature.layer.id === 'trips-layer') {
        const item = current.trips.find((trip) => trip.id === properties.id);
        if (item) setSelected({ kind: 'trip', item });
      } else if (feature.layer.id === 'routes-layer') {
        const item = current.routes.find((route) => route.id === properties.id);
        if (item) setSelected({ kind: 'route', item });
      } else if (feature.layer.id === 'stations-layer') {
        setSelected({ kind: 'station', name: properties.name });
      }
    };
    const onMove = (event: MapMouseEvent) => {
      const interactiveLayers = ['drivers-layer', 'requests-layer', 'trips-layer', 'routes-layer', 'stations-layer'].filter((id) => Boolean(map.getLayer(id)));
      map.getCanvas().style.cursor = interactiveLayers.length && map.queryRenderedFeatures(event.point, { layers: interactiveLayers }).length ? 'pointer' : '';
    };
    map.on('load', onLoad);
    map.on('error', onError);
    map.on('click', onClick);
    map.on('mousemove', onMove);
    return () => {
      map.off('load', onLoad);
      map.off('error', onError);
      map.off('click', onClick);
      map.off('mousemove', onMove);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !data) return;

    const routeLines = data.routes.filter((route) => route.status === 'نشط' && route.stations.length > 1).map((route) => lineFeature(route.id, route.stations.map((station) => demoLngLat(station.mapX, station.mapY)), { name: route.name, color: route.color }));
    const tripLines = data.trips.map((trip, index) => {
      const origin = tripOrigins[index % tripOrigins.length];
      const driver = data.drivers.find((item) => item.id === trip.driverId);
      const end = driver ? demoLngLat(driver.mapX, driver.mapY) : demoLngLat(origin.x + 12, origin.y + 8);
      return lineFeature(trip.id, [demoLngLat(origin.x, origin.y), end], { name: `${trip.driverName} مع ${trip.passengerName}`, state: trip.status });
    });
    const requestFeatures = data.requests.map((request, index) => pointFeature(request.id, demoLngLat(requestPoints[index % requestPoints.length].x, requestPoints[index % requestPoints.length].y), { name: request.passengerName, state: request.status, detail: `${request.from} ← ${request.to}` }));
    const driverFeatures = activeDrivers.map((driver) => pointFeature(driver.id, demoLngLat(driver.mapX, driver.mapY), { name: driver.name, state: driver.state, detail: driver.routeName }));
    const stationFeatures = data.routes.flatMap((route) => route.stations.map((station) => pointFeature(station.id, demoLngLat(station.mapX, station.mapY), { name: station.name, color: route.color, detail: route.name })));

    syncGeoJson(map, 'routes-source', lineCollection(routeLines));
    syncGeoJson(map, 'trips-source', lineCollection(tripLines));
    syncGeoJson(map, 'requests-source', pointCollection(requestFeatures));
    syncGeoJson(map, 'stations-source', pointCollection(stationFeatures));
    syncGeoJson(map, 'drivers-source', pointCollection(driverFeatures));

    if (!map.getLayer('routes-layer')) map.addLayer({ id: 'routes-layer', type: 'line', source: 'routes-source', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': 0.62, 'line-dasharray': [2, 1.5] } });
    if (!map.getLayer('trips-layer')) map.addLayer({ id: 'trips-layer', type: 'line', source: 'trips-source', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#536fc5', 'line-width': 4, 'line-opacity': 0.88 } });
    if (!map.getLayer('stations-layer')) map.addLayer({ id: 'stations-layer', type: 'circle', source: 'stations-source', paint: { 'circle-radius': 4.5, 'circle-color': ['get', 'color'], 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } });
    if (!map.getLayer('requests-layer')) map.addLayer({ id: 'requests-layer', type: 'circle', source: 'requests-source', paint: { 'circle-radius': 7, 'circle-color': '#e6a13e', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#fff' } });
    if (!map.getLayer('drivers-layer')) map.addLayer({ id: 'drivers-layer', type: 'circle', source: 'drivers-source', paint: { 'circle-radius': ['case', ['==', ['get', 'state'], 'في رحلة'], 10, 8], 'circle-color': ['case', ['==', ['get', 'state'], 'في رحلة'], '#486dbf', '#0d8587'], 'circle-stroke-width': 2.5, 'circle-stroke-color': '#fff' } });
    const visibility: [keyof Layers, string][] = [['routes', 'routes-layer'], ['trips', 'trips-layer'], ['stations', 'stations-layer'], ['requests', 'requests-layer'], ['drivers', 'drivers-layer']];
    for (const [key, id] of visibility) map.setLayoutProperty(id, 'visibility', layers[key] ? 'visible' : 'none');
  }, [activeDrivers, data, layers, mapReady]);

  const focusDriver = (driver: Driver) => {
    setSelected({ kind: 'driver', item: driver });
    mapRef.current?.easeTo({ center: demoLngLat(driver.mapX, driver.mapY), zoom: 13, duration: 500 });
  };

  return <>
    <PageHeading title="الخريطة التشغيلية" subtitle="خلفية OpenFreeMap ببيانات OpenStreetMap للإسكندرية؛ كل مواقع السائقين والطلبات هنا أمثلة مكانية وليست GPS حيًا." icon={<Navigation size={17} />} actions={<button className="button button-secondary" onClick={reload}><Activity size={16} /> تحديث بيانات العرض</button>} />
    <div className="map-summary">
      <div><span className="map-summary-icon teal-bg"><BusFront size={18} /></span><span><b>{activeDrivers.length || (data ? 0 : '—')}</b><small>سائق في عينة العرض</small></span></div>
      <div><span className="map-summary-icon violet-bg"><RouteIcon size={18} /></span><span><b>{data?.trips.length ?? '—'}</b><small>رحلة في العينة</small></span></div>
      <div><span className="map-summary-icon amber-bg"><MapPin size={18} /></span><span><b>{data?.requests.length ?? '—'}</b><small>طلب في العينة</small></span></div>
      <div><span className="map-summary-icon blue-bg"><CircleDot size={18} /></span><span><b>{data?.routes.filter((route) => route.status === 'نشط').length ?? '—'}</b><small>مسار نشط تجريبي</small></span></div>
      <span className="mock-map-note"><i /> OpenFreeMap + OSM · مواقع Mock وليست GPS</span>
    </div>

    <div className="operations-map-layout">
      <section className="panel map-panel">
        <div className="map-toolbar">
          <div className="map-tool-title"><Layers3 size={17} /><b>طبقات الخريطة</b></div>
          <div className="map-layer-switches">
            <button className={layers.drivers ? 'enabled' : ''} onClick={() => toggleLayer('drivers')}><BusFront size={14} />السائقون</button>
            <button className={layers.trips ? 'enabled' : ''} onClick={() => toggleLayer('trips')}><RouteIcon size={14} />الرحلات</button>
            <button className={layers.requests ? 'enabled' : ''} onClick={() => toggleLayer('requests')}><MapPin size={14} />الطلبات</button>
            <button className={layers.routes ? 'enabled' : ''} onClick={() => toggleLayer('routes')}><RouteIcon size={14} />المسارات</button>
            <button className={layers.stations ? 'enabled' : ''} onClick={() => toggleLayer('stations')}><CircleDot size={14} />المحطات</button>
          </div>
        </div>
        <div className="map-canvas" aria-label="خريطة تشغيلية لمدينة الإسكندرية من OpenFreeMap وOpenStreetMap">
          <div ref={mapContainerRef} className="maplibre-map" />
          <div className="map-demo-overlay"><span className="map-demo-overlay-dot" /> مواقع تجريبية — لا تتبع حي</div>
          {mapError && <div className="map-error-overlay"><b>خلفية الخريطة غير متاحة</b><span>{mapError}</span></div>}
          {loading && <div className="map-status-overlay"><span className="spinner" />جارٍ تحميل بيانات العرض…</div>}
          {error && <div className="map-status-overlay map-status-error"><b>تعذر تحميل نقاط العرض</b><span>{error}</span><button className="button button-secondary" onClick={reload}>إعادة المحاولة</button></div>}
        </div>
        <div className="map-legend"><span><i className="legend-driver" /> سائق متاح/في رحلة</span><span><i className="legend-trip" /> مسار رحلة تجريبي</span><span><i className="legend-request" /> طلب تجريبي</span><span><i className="legend-station" /> محطة</span><span className="legend-foot"><MapPin size={13} /> OpenFreeMap · © OpenMapTiles · بيانات OpenStreetMap</span></div>
      </section>

      <aside className="panel map-side-panel">
        <div className="map-side-heading"><div><span className="panel-kicker">الأسطول التجريبي</span><h2>السائقون على الخريطة</h2></div><span className="map-online-count">{activeDrivers.length}</span></div>
        <label className="search-box map-driver-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن سائق…" /></label>
        <div className="map-driver-list">{activeDrivers.map((driver) => <button className={`map-driver-row${selected?.kind === 'driver' && selected.item.id === driver.id ? ' selected' : ''}`} key={driver.id} onClick={() => focusDriver(driver)}><span className={`map-mini-avatar${driver.state === 'في رحلة' ? ' on-trip' : ''}`}><BusFront size={15} /></span><span className="map-driver-copy"><b>{driver.name}</b><small>{driver.routeName}</small></span><span className="map-driver-state"><i className={driver.state === 'في رحلة' ? 'in-trip' : ''} />{driver.state === 'في رحلة' ? 'في رحلة' : 'متاح'}</span></button>)}</div>
        {selected && <div className="map-selection-card">
          <button className="selection-close" onClick={() => setSelected(null)}>×</button>
          {selected.kind === 'driver' ? <><span className="panel-kicker">سائق محدد · بيانات Demo</span><b>{selected.item.name}</b><small>{selected.item.id} · {selected.item.vehicle}</small><small>آخر ظهور: {selected.item.lastSeen} · الموقع غير حي</small><StatusBadge value={selected.item.state} /></> : selected.kind === 'request' ? <><span className="panel-kicker">طلب محدد</span><b>{selected.item.id} · {selected.item.passengerName}</b><small>{selected.item.from} ← {selected.item.to}</small><StatusBadge value={selected.item.status} /></> : selected.kind === 'trip' ? <><span className="panel-kicker">رحلة محددة · {selected.item.id}</span><b>{selected.item.driverName} مع {selected.item.passengerName}</b><small>{selected.item.from} ← {selected.item.to}</small><StatusBadge value={selected.item.status} /></> : selected.kind === 'route' ? <><span className="panel-kicker">مسار محدد</span><b>{selected.item.name}</b><small>{selected.item.stations.length} محطة · بيانات تقريبية</small><StatusBadge value={selected.item.status} /></> : <><span className="panel-kicker">محطة على المسار</span><b>{selected.name}</b><small>موضعها على الخريطة تقريبي</small></>}
        </div>}
        <div className="map-side-footer"><span><Activity size={14} /> مصدر نقاط الحركة</span><b>بيانات Demo</b></div>
      </aside>
    </div>
  </>;
}
