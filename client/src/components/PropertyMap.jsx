import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/PropertyMap.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * PropertyMap
 *
 * Props:
 *   coordinates  {[lng, lat]}  - required to show the map
 *   address      {string}      - used in the marker popup
 *   height       {string}      - CSS height, default '320px'
 */
const PropertyMap = ({ coordinates, address, height = '320px' }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !coordinates?.length || !containerRef.current) return;
    if (mapRef.current) return; // already initialized

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const [lng, lat] = coordinates;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Red property marker
    const el = document.createElement('div');
    el.className = 'property-map-marker';

    new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<p class="property-map-popup">${address || 'Property Location'}</p>`
        )
      )
      .addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates, address]);

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.YOUR_TOKEN_HERE') {
    return (
      <div className="property-map-missing-token">
        Map unavailable — add <code>VITE_MAPBOX_TOKEN</code> to <code>client/.env</code>
      </div>
    );
  }

  if (!coordinates?.length) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="property-map-container"
      style={{ height }}
    />
  );
};

export default PropertyMap;
