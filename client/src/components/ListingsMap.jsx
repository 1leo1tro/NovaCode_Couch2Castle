import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/ListingsMap.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const ListingsMap = ({ listings = [], cityQuery = '', mapHighlightRef, onMarkerHover, onMarkerClick, onBoundsChange }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const hasUserInteracted = useRef(false);
  const initialFitDone = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  function emitBounds() {
    const map = mapRef.current;
    if (!map || !onBoundsChange) return;
    const b = map.getBounds();
    onBoundsChange({ minLng: b.getWest(), maxLng: b.getEast(), minLat: b.getSouth(), maxLat: b.getNorth() });
  }

  // Initialize map once
  useEffect(() => {
    if (!MAPBOX_TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283],
      zoom: 4,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // GeoJSON source with clustering
      map.addSource('listings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 7,
        clusterRadius: 60,
      });

      // Cluster bubble
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'listings',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#1a7ab8', 10, '#0f5280', 40, '#082d45'
          ],
          'circle-radius': [
            'step', ['get', 'point_count'],
            22, 10, 30, 40, 40
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,0.6)',
          'circle-opacity': 0.92,
        },
      });

      // Cluster count label
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'listings',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual points (unclustered)
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'listings',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#0f5280',
          'circle-radius': 9,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      // Highlighted individual point (card hover)
      map.addLayer({
        id: 'unclustered-highlight',
        type: 'circle',
        source: 'listings',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-color': '#e53e3e',
          'circle-radius': 11,
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1,
        },
      });

      setMapLoaded(true);
      emitBounds();
    });

    // Cluster click → zoom in
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties.cluster_id;
      map.getSource('listings').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 0.5 });
      });
    });

    // Individual point click → open panel
    map.on('click', 'unclustered-point', (e) => {
      const { id } = e.features[0].properties;
      const coords = e.features[0].geometry.coordinates.slice();
      map.flyTo({ center: coords, zoom: Math.max(map.getZoom(), 14), duration: 1200, essential: true });
      onMarkerClick?.(id);
    });

    // Hover → popup + card highlight
    map.on('mouseenter', 'unclustered-point', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const props = e.features[0].properties;
      const coords = e.features[0].geometry.coordinates.slice();
      onMarkerHover?.(props.id);

      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({ offset: 14, closeButton: false, closeOnClick: false })
        .setLngLat(coords)
        .setHTML(`
          <div class="listings-map-popup">
            ${props.image ? `<img class="listings-map-popup-img" src="${props.image}" alt="" />` : ''}
            <div class="listings-map-popup-body">
              <p class="listings-map-popup-price">$${Number(props.price).toLocaleString()}</p>
              <p class="listings-map-popup-address">${props.address}</p>
            </div>
          </div>
        `)
        .addTo(map);
    });

    map.on('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = '';
      popupRef.current?.remove();
      popupRef.current = null;
      onMarkerHover?.(null);
    });

    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

    map.on('movestart', (e) => { if (e.originalEvent) hasUserInteracted.current = true; });
    map.on('moveend', emitBounds);
    map.on('zoomend', emitBounds);

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Wire highlight ref so Listings.jsx card hover changes the marker color
  useEffect(() => {
    if (!mapHighlightRef) return;
    mapHighlightRef.current = (id) => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;
      map.setFilter('unclustered-highlight', ['==', ['get', 'id'], id || '']);
    };
  }, [mapHighlightRef]);

  // Update source data when listings change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const valid = listings.filter(l => l.location?.coordinates?.length === 2);
    const geojson = {
      type: 'FeatureCollection',
      features: valid.map(l => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: l.location.coordinates },
        properties: {
          id: l._id,
          price: l.price,
          address: l.address,
          image: l.images?.[0] || '',
        },
      })),
    };

    const apply = () => {
      const source = map.getSource('listings');
      if (source) source.setData(geojson);

      if (!hasUserInteracted.current && !initialFitDone.current && valid.length > 0) {
        if (valid.length === 1) {
          map.flyTo({ center: valid[0].location.coordinates, zoom: 13 });
        } else {
          const bounds = new mapboxgl.LngLatBounds();
          valid.forEach(l => bounds.extend(l.location.coordinates));
          map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 800 });
        }
        initialFitDone.current = true;
      }

      emitBounds();
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [listings]);

  // City boundary outline from Nominatim
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const removeBoundary = () => {
      if (map.getLayer('city-boundary-fill')) map.removeLayer('city-boundary-fill');
      if (map.getLayer('city-boundary-line')) map.removeLayer('city-boundary-line');
      if (map.getSource('city-boundary')) map.removeSource('city-boundary');
    };

    const query = cityQuery?.trim();
    if (!query || query.length < 3) { removeBoundary(); return; }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=geojson&polygon_geojson=1&limit=3&featuretype=city`,
        { signal: controller.signal, headers: { 'Accept': 'application/json' } }
      )
        .then(r => r.json())
        .then(data => {
          const feature = data.features?.find(f =>
            f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
          );
          removeBoundary();
          if (!feature) return;

          map.addSource('city-boundary', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [feature] },
          });
          map.addLayer({
            id: 'city-boundary-fill',
            type: 'fill',
            source: 'city-boundary',
            paint: { 'fill-color': '#0f5280', 'fill-opacity': 0.06 },
          }, 'clusters');
          map.addLayer({
            id: 'city-boundary-line',
            type: 'line',
            source: 'city-boundary',
            paint: {
              'line-color': '#0f5280',
              'line-width': 2,
              'line-dasharray': [5, 3],
              'line-opacity': 0.65,
            },
          }, 'clusters');
        })
        .catch(() => {});
    }, 700);

    return () => { clearTimeout(timer); controller.abort(); removeBoundary(); };
  }, [cityQuery, mapLoaded]);

  if (!MAPBOX_TOKEN) return null;

  return (
    <div className="listings-map-wrapper">
      <div ref={containerRef} className="listings-map-container" />
      {!mapLoaded && <div className="listings-map-skeleton" />}
    </div>
  );
};

export default ListingsMap;
