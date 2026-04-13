import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../styles/ListingsMap.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * ListingsMap
 *
 * Props:
 *   listings    {Array}   - array of listing objects (must have location.coordinates)
 *   hoveredId   {string}  - _id of the currently hovered listing card
 *   onMarkerHover {fn}    - called with (id | null) on marker mouseenter/leave
 */
const ListingsMap = ({ listings = [], hoveredId, onMarkerHover, onMarkerClick }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);

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
    map.once('load', () => setMapLoaded(true));

    return () => {
      Object.values(markersRef.current).forEach(({ marker }) => marker.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers whenever listings change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(({ marker }) => marker.remove());
    markersRef.current = {};

    const valid = listings.filter(l => l.location?.coordinates?.length === 2);

    valid.forEach(listing => {
      const [lng, lat] = listing.location.coordinates;

      const el = document.createElement('div');
      el.className = 'listings-map-marker';

      const firstImage = listing.images?.[0];
      const popup = new mapboxgl.Popup({ offset: 28, closeButton: false, closeOnClick: false })
        .setHTML(`
          <div class="listings-map-popup">
            ${firstImage ? `<img class="listings-map-popup-img" src="${firstImage}" alt="${listing.address}" />` : ''}
            <div class="listings-map-popup-body">
              <p class="listings-map-popup-price">$${listing.price.toLocaleString()}</p>
              <p class="listings-map-popup-address">${listing.address}</p>
            </div>
          </div>
        `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map);

      el.addEventListener('mouseenter', () => {
        popup.setLngLat([lng, lat]).addTo(map);
        onMarkerHover?.(listing._id);
      });
      el.addEventListener('mouseleave', () => {
        popup.remove();
        onMarkerHover?.(null);
      });
      el.addEventListener('click', () => {
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 1400, essential: true });
        onMarkerClick?.(listing._id);
      });

      markersRef.current[listing._id] = { marker, el };
    });

    // Fit bounds to show all markers
    if (valid.length === 1) {
      map.flyTo({ center: valid[0].location.coordinates, zoom: 13 });
    } else if (valid.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      valid.forEach(l => bounds.extend(l.location.coordinates));
      map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 800 });
    }
  }, [listings]);

  // Highlight hovered marker
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, { el }]) => {
      el.classList.toggle('listings-map-marker--active', id === hoveredId);
    });
  }, [hoveredId]);

  if (!MAPBOX_TOKEN) return null;

  return (
    <div className="listings-map-wrapper">
      <div ref={containerRef} className="listings-map-container" />
      {!mapLoaded && <div className="listings-map-skeleton" />}
    </div>
  );
};

export default ListingsMap;
